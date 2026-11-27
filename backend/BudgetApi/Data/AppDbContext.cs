using Microsoft.EntityFrameworkCore;
using BudgetApi.Models;

namespace BudgetApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<Transaction> Transactions { get; set; }
    public DbSet<SavingsGoal> SavingsGoals { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SavingsGoal>()
            .Property(goal => goal.TargetAmount)
            .HasColumnType("TEXT");
        modelBuilder.Entity<SavingsGoal>()
            .Property(goal => goal.SavedAmount)
            .HasColumnType("TEXT");
    }
}
