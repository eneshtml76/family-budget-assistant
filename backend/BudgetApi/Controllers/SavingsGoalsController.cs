using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BudgetApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SavingsGoalsController : ControllerBase
{
    private readonly AppDbContext _context;

    public SavingsGoalsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("{userId}")]
    public async Task<IActionResult> GetAllByUser(int userId)
    {
        var goals = await _context.SavingsGoals
            .Where(goal => goal.UserId == userId)
            .OrderBy(goal => goal.Id)
            .ToListAsync();
        return Ok(goals);
    }

    [HttpPost]
    public async Task<IActionResult> Add(SavingsGoal newGoal)
    {
        if (newGoal.UserId <= 0 ||
            string.IsNullOrWhiteSpace(newGoal.Name) ||
            newGoal.TargetAmount <= 0)
        {
            return BadRequest("A valid user, goal name, and target amount are required.");
        }

        newGoal.Name = newGoal.Name.Trim();
        newGoal.SavedAmount = 0;
        _context.SavingsGoals.Add(newGoal);
        await _context.SaveChangesAsync();
        return Ok(newGoal);
    }

    [HttpPost("{id}/contributions")]
    public async Task<IActionResult> AddContribution(int id, ContributionRequest request)
    {
        if (request.UserId <= 0 || request.Amount <= 0)
        {
            return BadRequest("A valid user and contribution amount are required.");
        }

        var goal = await _context.SavingsGoals
            .FirstOrDefaultAsync(item => item.Id == id && item.UserId == request.UserId);
        if (goal == null) return NotFound();

        goal.SavedAmount += request.Amount;
        await _context.SaveChangesAsync();
        return Ok(goal);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id, [FromQuery] int userId)
    {
        var goal = await _context.SavingsGoals
            .FirstOrDefaultAsync(item => item.Id == id && item.UserId == userId);
        if (goal == null) return NotFound();

        _context.SavingsGoals.Remove(goal);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    public class ContributionRequest
    {
        public int UserId { get; set; }
        public decimal Amount { get; set; }
    }
}
