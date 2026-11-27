using BudgetApi; // Required so Program.cs can find AppDbContext
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// 1. Register SQLite database connection
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=budget.db"));

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

    db.Database.OpenConnection();
    try
    {
        var connection = db.Database.GetDbConnection();
        using var command = connection.CreateCommand();
        command.CommandText = "PRAGMA table_info('Transactions')";
        using var reader = command.ExecuteReader();
        var hasCategoryColumn = false;
        while (reader.Read())
        {
            if (reader.GetString(1) == "Category")
            {
                hasCategoryColumn = true;
                break;
            }
        }

        reader.Close();
        if (!hasCategoryColumn)
        {
            db.Database.ExecuteSqlRaw(
                "ALTER TABLE Transactions ADD COLUMN Category TEXT NOT NULL DEFAULT 'other'");
        }
    }
    finally
    {
        db.Database.CloseConnection();
    }
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
