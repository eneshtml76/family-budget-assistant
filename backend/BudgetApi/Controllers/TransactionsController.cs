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
public class TransactionsController : ControllerBase
{
    private readonly AppDbContext _context;

    public TransactionsController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/transactions
    [HttpGet]
    public async Task<IActionResult> GetAllByUser()
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized();

        var transactions = await _context.Transactions
            .Where(t => t.UserId == userId)
            .ToListAsync();
        foreach (var transaction in transactions)
        {
            NormalizeCreatedAt(transaction);
        }
        return Ok(transactions);
    }

    // POST: api/transactions
    [HttpPost]
    public async Task<IActionResult> Add(TransactionRequest request)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized();

        if (string.IsNullOrWhiteSpace(request.Description) ||
            request.Amount <= 0 ||
            (request.Type != "gelir" && request.Type != "gider"))
        {
            return BadRequest("A valid description, amount, and transaction type are required.");
        }

        var newTransaction = new Transaction
        {
            UserId = userId,
            Description = request.Description.Trim(),
            Amount = request.Amount,
            Type = request.Type,
            Category = request.Category,
            CreatedAt = request.CreatedAt
        };
        newTransaction.CreatedAt ??= DateTime.UtcNow;
        NormalizeCreatedAt(newTransaction);
        _context.Transactions.Add(newTransaction);
        await _context.SaveChangesAsync();
        return Ok(newTransaction);
    }

    // PUT: api/transactions/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, TransactionRequest updatedTransaction)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized();

        var transaction = await _context.Transactions
            .FirstOrDefaultAsync(item => item.Id == id && item.UserId == userId);
        if (transaction == null) return NotFound();
        if (string.IsNullOrWhiteSpace(updatedTransaction.Description) ||
            updatedTransaction.Amount <= 0 ||
            (updatedTransaction.Type != "gelir" && updatedTransaction.Type != "gider"))
        {
            return BadRequest("A valid description, amount, and transaction type are required.");
        }

        transaction.Description = updatedTransaction.Description.Trim();
        transaction.Amount = updatedTransaction.Amount;
        transaction.Type = updatedTransaction.Type;
        transaction.Category = updatedTransaction.Category;
        if (updatedTransaction.CreatedAt.HasValue)
        {
            transaction.CreatedAt = updatedTransaction.CreatedAt;
        }
        NormalizeCreatedAt(transaction);
        await _context.SaveChangesAsync();
        return Ok(transaction);
    }

    // DELETE: api/transactions/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized();

        var transaction = await _context.Transactions
            .FirstOrDefaultAsync(item => item.Id == id && item.UserId == userId);
        if (transaction == null) return NotFound();

        _context.Transactions.Remove(transaction);
        await _context.SaveChangesAsync();
        return Ok();
    }

    private static void NormalizeCreatedAt(Transaction transaction)
    {
        if (transaction.CreatedAt.HasValue)
        {
            transaction.CreatedAt = DateTime.SpecifyKind(transaction.CreatedAt.Value, DateTimeKind.Utc);
        }
    }

    private bool TryGetUserId(out int userId)
    {
        return int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out userId);
    }

    public sealed class TransactionRequest
    {
        public string Description { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Category { get; set; } = "other";
        public DateTime? CreatedAt { get; set; }
    }
}
