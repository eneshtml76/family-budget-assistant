using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BudgetApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TransactionsController : ControllerBase
{
    private readonly AppDbContext _context;

    public TransactionsController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/transactions/{userId}
    [HttpGet("{userId}")]
    public async Task<IActionResult> GetAllByUser(int userId)
    {
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
    public async Task<IActionResult> Add(Transaction newTransaction)
    {
        if (string.IsNullOrWhiteSpace(newTransaction.Description) ||
            newTransaction.Amount <= 0 ||
            (newTransaction.Type != "gelir" && newTransaction.Type != "gider"))
        {
            return BadRequest("A valid description, amount, and transaction type are required.");
        }

        newTransaction.CreatedAt = DateTime.UtcNow;
        _context.Transactions.Add(newTransaction);
        await _context.SaveChangesAsync();
        return Ok(newTransaction);
    }

    // PUT: api/transactions/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, Transaction updatedTransaction)
    {
        var transaction = await _context.Transactions.FindAsync(id);
        if (transaction == null) return NotFound();
        if (transaction.UserId != updatedTransaction.UserId) return Forbid();
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
        NormalizeCreatedAt(transaction);
        await _context.SaveChangesAsync();
        return Ok(transaction);
    }

    // DELETE: api/transactions/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var transaction = await _context.Transactions.FindAsync(id);
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
}
