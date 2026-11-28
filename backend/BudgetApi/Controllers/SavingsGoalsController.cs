using BudgetApi.Data;
using BudgetApi.Models;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BudgetApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SavingsGoalsController : ControllerBase
{
    private readonly AppDbContext _context;

    public SavingsGoalsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllByUser()
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized();

        var goals = await _context.SavingsGoals
            .Where(goal => goal.UserId == userId)
            .OrderBy(goal => goal.Id)
            .ToListAsync();
        return Ok(goals);
    }

    [HttpPost]
    public async Task<IActionResult> Add(CreateSavingsGoalRequest request)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized();

        if (string.IsNullOrWhiteSpace(request.Name) || request.TargetAmount <= 0)
        {
            return BadRequest("A valid goal name and target amount are required.");
        }

        var newGoal = new SavingsGoal
        {
            UserId = userId,
            Name = request.Name.Trim(),
            TargetAmount = request.TargetAmount,
            SavedAmount = 0
        };
        _context.SavingsGoals.Add(newGoal);
        await _context.SaveChangesAsync();
        return Ok(newGoal);
    }

    [HttpPost("{id}/contributions")]
    public async Task<IActionResult> AddContribution(int id, ContributionRequest request)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized();

        if (request.Amount <= 0)
        {
            return BadRequest("A valid contribution amount is required.");
        }

        var goal = await _context.SavingsGoals
            .FirstOrDefaultAsync(item => item.Id == id && item.UserId == userId);
        if (goal == null) return NotFound();

        goal.SavedAmount += request.Amount;
        await _context.SaveChangesAsync();
        return Ok(goal);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized();

        var goal = await _context.SavingsGoals
            .FirstOrDefaultAsync(item => item.Id == id && item.UserId == userId);
        if (goal == null) return NotFound();

        _context.SavingsGoals.Remove(goal);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    public class ContributionRequest
    {
        public decimal Amount { get; set; }
    }

    public sealed class CreateSavingsGoalRequest
    {
        public string Name { get; set; } = string.Empty;
        public decimal TargetAmount { get; set; }
    }

    private bool TryGetUserId(out int userId)
    {
        return int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out userId);
    }
}
