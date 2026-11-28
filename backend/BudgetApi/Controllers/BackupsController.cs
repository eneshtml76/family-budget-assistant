using BudgetApi.Data;
using BudgetApi.Models;
using BudgetApi.Security;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BudgetApi.Controllers;

[ApiController]
[Route("api/backups")]
public class BackupsController : ControllerBase
{
    private static readonly HashSet<string> AllowedCategories = new(StringComparer.Ordinal)
    {
        "groceries", "bills", "housing", "transport", "dining", "health",
        "education", "clothing", "entertainment", "salary", "extra_income", "other"
    };

    private readonly AppDbContext _context;

    public BackupsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost("{userId:int}/restore")]
    public async Task<IActionResult> Restore(int userId, BackupRestoreRequest request)
    {
        if (userId <= 0 ||
            request.SchemaVersion != 1 ||
            request.Transactions is null ||
            request.SavingsGoals is null ||
            request.Transactions.Count > 20000 ||
            request.SavingsGoals.Count > 1000)
        {
            return BadRequest("The backup file is invalid or exceeds the supported size.");
        }

        var user = await _context.Users.FirstOrDefaultAsync(item => item.Id == userId);
        if (user is null) return NotFound("The account was not found.");
        if (string.IsNullOrWhiteSpace(request.Username) ||
            string.IsNullOrEmpty(request.Password) ||
            !string.Equals(user.Username, request.Username.Trim(), StringComparison.Ordinal) ||
            !PasswordHasher.Verify(request.Password, user.PasswordHash))
        {
            return Unauthorized("The account password is incorrect.");
        }

        if (request.Transactions.Any(item =>
                item is null ||
                string.IsNullOrWhiteSpace(item.Description) ||
                item.Description.Length > 200 ||
                item.Amount <= 0 ||
                (item.Type != "gelir" && item.Type != "gider") ||
                string.IsNullOrWhiteSpace(item.Category) ||
                !AllowedCategories.Contains(item.Category) ||
                (item.CreatedAt.HasValue && item.CreatedAt.Value == default)) ||
            request.SavingsGoals.Any(goal =>
                goal is null ||
                string.IsNullOrWhiteSpace(goal.Name) ||
                goal.Name.Length > 60 ||
                goal.TargetAmount <= 0 ||
                goal.SavedAmount < 0))
        {
            return BadRequest("The backup contains invalid transactions or savings goals.");
        }

        await using var databaseTransaction = await _context.Database.BeginTransactionAsync();
        var existingTransactions = await _context.Transactions
            .Where(item => item.UserId == userId)
            .ToListAsync();
        var existingGoals = await _context.SavingsGoals
            .Where(goal => goal.UserId == userId)
            .ToListAsync();

        _context.Transactions.RemoveRange(existingTransactions);
        _context.SavingsGoals.RemoveRange(existingGoals);
        _context.Transactions.AddRange(request.Transactions.Select(item => new Transaction
        {
            UserId = userId,
            Description = item.Description.Trim(),
            Amount = item.Amount,
            Type = item.Type,
            Category = item.Category,
            CreatedAt = item.CreatedAt.HasValue
                ? DateTime.SpecifyKind(item.CreatedAt.Value, DateTimeKind.Utc)
                : null
        }));
        _context.SavingsGoals.AddRange(request.SavingsGoals.Select(goal => new SavingsGoal
        {
            UserId = userId,
            Name = goal.Name.Trim(),
            TargetAmount = goal.TargetAmount,
            SavedAmount = goal.SavedAmount
        }));

        await _context.SaveChangesAsync();
        await databaseTransaction.CommitAsync();
        return Ok(new
        {
            transactionCount = request.Transactions.Count,
            savingsGoalCount = request.SavingsGoals.Count
        });
    }

    public sealed class BackupRestoreRequest
    {
        public int SchemaVersion { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public List<BackupTransaction>? Transactions { get; set; }
        public List<BackupSavingsGoal>? SavingsGoals { get; set; }
    }

    public sealed class BackupTransaction
    {
        public string Description { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public DateTime? CreatedAt { get; set; }
    }

    public sealed class BackupSavingsGoal
    {
        public string Name { get; set; } = string.Empty;
        public decimal TargetAmount { get; set; }
        public decimal SavedAmount { get; set; }
    }
}
