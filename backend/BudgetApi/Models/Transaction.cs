namespace BudgetApi.Models;

// Represents a financial transaction linked to a specific user
public class Transaction
{
    public int Id { get; set; }
    public int UserId { get; set; } // Links transaction to its owner
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Type { get; set; } = string.Empty; // "gelir" or "gider"
    public string Category { get; set; } = "other";
    public DateTime? CreatedAt { get; set; }
}
