namespace BudgetApi.Models;

public class SavingsGoal
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal TargetAmount { get; set; }
    public decimal SavedAmount { get; set; }
}
