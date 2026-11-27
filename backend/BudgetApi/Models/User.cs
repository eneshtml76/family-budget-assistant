namespace BudgetApi.Models;

// Represents a registered user account
public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty; // Never store plain-text passwords
}
