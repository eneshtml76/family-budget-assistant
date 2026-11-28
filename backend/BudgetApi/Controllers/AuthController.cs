using BudgetApi.Data;
using BudgetApi.Models;
using BudgetApi.Security;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace BudgetApi.Controllers;

[ApiController]
[Route("api/[controller]")] // Endpoint: http://localhost:5098/api/auth
[AllowAnonymous]
[EnableRateLimiting("auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly PasswordHasher _passwordHasher;
    private readonly JwtBearerOptions _jwtOptions;

    public AuthController(
        AppDbContext context,
        PasswordHasher passwordHasher,
        IOptionsMonitor<JwtBearerOptions> jwtOptions)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _jwtOptions = jwtOptions.Get(JwtBearerDefaults.AuthenticationScheme);
    }

    // DTO for incoming login/register requests
    public class AuthRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    // POST: api/auth/register
    [HttpPost("register")]
    public async Task<IActionResult> Register(AuthRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest("Username and password are required.");

        var exists = await _context.Users.AnyAsync(u => u.Username == request.Username.Trim());
        if (exists)
            return BadRequest("Username already exists.");

        var newUser = new User { Username = request.Username.Trim() };
        newUser.PasswordHash = _passwordHasher.Hash(newUser, request.Password);

        _context.Users.Add(newUser);
        await _context.SaveChangesAsync();

        return Ok(CreateToken(newUser));
    }

    // POST: api/auth/login
    [HttpPost("login")]
    public async Task<IActionResult> Login(AuthRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrEmpty(request.Password))
            return Unauthorized("Invalid username or password.");

        var user = await _context.Users.FirstOrDefaultAsync(u =>
            u.Username == request.Username.Trim());

        if (user == null)
            return Unauthorized("Invalid username or password.");

        var verification = _passwordHasher.Verify(user, request.Password);
        if (verification == PasswordVerificationResult.Failed)
            return Unauthorized("Invalid username or password.");

        if (verification == PasswordVerificationResult.SuccessRehashNeeded)
        {
            user.PasswordHash = _passwordHasher.Hash(user, request.Password);
            await _context.SaveChangesAsync();
        }

        return Ok(CreateToken(user));
    }

    private object CreateToken(User user)
    {
        var validationParameters = _jwtOptions.TokenValidationParameters;
        var signingKey = validationParameters.IssuerSigningKey
            ?? throw new InvalidOperationException("JWT signing key is not configured.");
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.UniqueName, user.Username)
        };
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            validationParameters.ValidIssuer,
            validationParameters.ValidAudience,
            claims,
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: credentials);

        return new
        {
            token = new JwtSecurityTokenHandler().WriteToken(token),
            userId = user.Id,
            username = user.Username
        };
    }
}
