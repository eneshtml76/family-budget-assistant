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
        return Ok(transactions);
    }

    // POST: api/transactions
    [HttpPost]
    public async Task<IActionResult> Add(Transaction newTransaction)
    {
        _context.Transactions.Add(newTransaction);
        await _context.SaveChangesAsync();
        return Ok(newTransaction);
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
}
