using BudgetApi.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

var databasePath = Environment.GetEnvironmentVariable("BUDGET_DB_PATH") ?? "budget.db";
var databaseDirectory = Path.GetDirectoryName(databasePath);
if (!string.IsNullOrEmpty(databaseDirectory))
{
    Directory.CreateDirectory(databaseDirectory);
}

// 1. Register SQLite database connection
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite($"Data Source={databasePath}"));

// 2. Add CORS policy to allow requests from the frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();

// 3. Automatically create the SQLite database file if it does not exist
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();

    EnsureColumn(db, "Transactions", "Category", "TEXT NOT NULL DEFAULT 'other'");
    EnsureColumn(db, "Transactions", "CreatedAt", "TEXT NULL");
    db.Database.ExecuteSqlRaw(
        """
        CREATE TABLE IF NOT EXISTS "SavingsGoals" (
            "Id" INTEGER NOT NULL CONSTRAINT "PK_SavingsGoals" PRIMARY KEY AUTOINCREMENT,
            "UserId" INTEGER NOT NULL,
            "Name" TEXT NOT NULL,
            "TargetAmount" TEXT NOT NULL,
            "SavedAmount" TEXT NOT NULL
        )
        """);
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// 4. Enable CORS before authorization and controllers
app.UseCors("AllowFrontend");

//app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();

static void EnsureColumn(AppDbContext db, string tableName, string columnName, string columnDefinition)
{
    db.Database.OpenConnection();
    try
    {
        var connection = db.Database.GetDbConnection();
        using var command = connection.CreateCommand();
        command.CommandText = $"PRAGMA table_info(\"{tableName}\")";

        var columnExists = false;
        using (var reader = command.ExecuteReader())
        {
            while (reader.Read())
            {
                if (reader.GetString(1) == columnName)
                {
                    columnExists = true;
                    break;
                }
            }
        }

        if (!columnExists)
        {
            using var alterCommand = connection.CreateCommand();
            alterCommand.CommandText =
                $"ALTER TABLE \"{tableName}\" ADD COLUMN \"{columnName}\" {columnDefinition}";
            alterCommand.ExecuteNonQuery();
        }
    }
    finally
    {
        db.Database.CloseConnection();
    }
}
