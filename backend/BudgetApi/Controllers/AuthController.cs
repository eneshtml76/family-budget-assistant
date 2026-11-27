using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BudgetApi.Controllers;

[ApiController]
[Route("api/[controller]")] // Endpoint: http://localhost:5098/api/auth
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;

    public AuthController(AppDbContext context)
    {
        _context = context;
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

        var newUser = new User
        {
            Username = request.Username.Trim(),
            PasswordHash = HashPassword(request.Password)
        };

        _context.Users.Add(newUser);
        await _context.SaveChangesAsync();

        return Ok(new { userId = newUser.Id, username = newUser.Username });
    }

    // POST: api/auth/login
    [HttpPost("login")]
    public async Task<IActionResult> Login(AuthRequest request)
    {
        var hashed = HashPassword(request.Password);
        var user = await _context.Users.FirstOrDefaultAsync(u =>
            u.Username == request.Username.Trim() && u.PasswordHash == hashed);

        if (user == null)
            return Unauthorized("Invalid username or password.");

        return Ok(new { userId = user.Id, username = user.Username });
    }

    // Cryptographic SHA-256 password hashing helper
    private static string HashPassword(string password)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(bytes);
    }
}
