using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using BudgetApi.Data;
using BudgetApi.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace BudgetApi.Tests;

public sealed class ApiSecurityTests : IAsyncLifetime
{
    private readonly BudgetApiFactory _factory = new();
    private HttpClient _client = null!;

    public Task InitializeAsync()
    {
        _client = _factory.CreateClient();
        return Task.CompletedTask;
    }

    public async Task DisposeAsync()
    {
        _client.Dispose();
        await _factory.DisposeAsync();
        SqliteConnection.ClearAllPools();
        if (File.Exists(_factory.DatabasePath))
            File.Delete(_factory.DatabasePath);
    }

    [Fact]
    public async Task RegisterReturnsJwtAndStoresIdentityPasswordHash()
    {
        var username = NewUsername();
        const string password = "correct horse battery staple";

        var session = await RegisterAsync(username, password);

        Assert.False(string.IsNullOrWhiteSpace(session.Token));
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var user = await db.Users.SingleAsync(item => item.Username == username);
        Assert.NotEqual(password, user.PasswordHash);
        Assert.Equal(
            PasswordVerificationResult.Success,
            new Microsoft.AspNetCore.Identity.PasswordHasher<User>()
                .VerifyHashedPassword(user, user.PasswordHash, password));
    }

    [Fact]
    public async Task LoginAcceptsValidCredentialsAndRejectsInvalidCredentials()
    {
        var user = await RegisterAsync();
        var validResponse = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            username = user.Username,
            password = DefaultPassword
        });
        var invalidResponse = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            username = user.Username,
            password = "wrong password"
        });

        Assert.Equal(HttpStatusCode.OK, validResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, invalidResponse.StatusCode);
        var loggedIn = await validResponse.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.False(string.IsNullOrWhiteSpace(loggedIn?.Token));
    }

    [Fact]
    public async Task LoginMigratesLegacySha256PasswordHash()
    {
        const string password = "legacy password";
        var username = NewUsername();
        var legacyHash = Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(password)));
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Users.Add(new User { Username = username, PasswordHash = legacyHash });
            await db.SaveChangesAsync();
        }

        var response = await _client.PostAsJsonAsync("/api/auth/login", new { username, password });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var verifyScope = _factory.Services.CreateScope();
        var verifyDb = verifyScope.ServiceProvider.GetRequiredService<AppDbContext>();
        var migratedUser = await verifyDb.Users.SingleAsync(item => item.Username == username);
        Assert.NotEqual(legacyHash, migratedUser.PasswordHash);
        Assert.Equal(
            PasswordVerificationResult.Success,
            new Microsoft.AspNetCore.Identity.PasswordHasher<User>()
                .VerifyHashedPassword(migratedUser, migratedUser.PasswordHash, password));
    }

    [Fact]
    public async Task TransactionsRequireAuthentication()
    {
        var response = await _client.GetAsync("/api/transactions");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task InvalidBearerTokenIsRejected()
    {
        using var request = AuthenticatedRequest(HttpMethod.Get, "/api/transactions", "not-a-valid-token");

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task TransactionsAreScopedToTokenAndIgnoreSpoofedOwner()
    {
        var owner = await RegisterAsync();
        var otherUser = await RegisterAsync();
        var created = await CreateTransactionAsync(owner.Token, "Private", 40, "gider", otherUser.UserId);

        var ownerTransactions = await GetTransactionsAsync(owner.Token);
        var otherTransactions = await GetTransactionsAsync(otherUser.Token);

        Assert.Equal(owner.UserId, created.UserId);
        Assert.Single(ownerTransactions);
        Assert.Empty(otherTransactions);
    }

    [Fact]
    public async Task UserCannotEditOrDeleteAnotherUsersTransaction()
    {
        var owner = await RegisterAsync();
        var otherUser = await RegisterAsync();
        var transaction = await CreateTransactionAsync(owner.Token, "Protected", 50, "gider");

        using var update = AuthenticatedRequest(
            HttpMethod.Put, $"/api/transactions/{transaction.Id}", otherUser.Token);
        update.Content = JsonContent.Create(new
        {
            description = "Changed",
            amount = 5,
            type = "gelir",
            category = "salary"
        });
        using var delete = AuthenticatedRequest(
            HttpMethod.Delete, $"/api/transactions/{transaction.Id}", otherUser.Token);

        Assert.Equal(HttpStatusCode.NotFound, (await _client.SendAsync(update)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _client.SendAsync(delete)).StatusCode);
        Assert.Equal("Protected", Assert.Single(await GetTransactionsAsync(owner.Token)).Description);
    }

    [Fact]
    public async Task UserCanEditAndDeleteOwnTransaction()
    {
        var owner = await RegisterAsync();
        var transaction = await CreateTransactionAsync(owner.Token, "Original", 50, "gider");

        using var update = AuthenticatedRequest(
            HttpMethod.Put, $"/api/transactions/{transaction.Id}", owner.Token);
        update.Content = JsonContent.Create(new
        {
            description = "Updated",
            amount = 65,
            type = "gelir",
            category = "salary"
        });
        var updateResponse = await _client.SendAsync(update);
        using var delete = AuthenticatedRequest(
            HttpMethod.Delete, $"/api/transactions/{transaction.Id}", owner.Token);
        var deleteResponse = await _client.SendAsync(delete);

        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);
        Assert.Equal(HttpStatusCode.OK, deleteResponse.StatusCode);
        Assert.Empty(await GetTransactionsAsync(owner.Token));
    }

    [Fact]
    public async Task SavingsGoalsAreScopedToTokenAndIgnoreSpoofedOwner()
    {
        var owner = await RegisterAsync();
        var otherUser = await RegisterAsync();
        using var create = AuthenticatedRequest(HttpMethod.Post, "/api/savingsgoals", owner.Token);
        create.Content = JsonContent.Create(new
        {
            userId = otherUser.UserId,
            name = "Emergency fund",
            targetAmount = 1000
        });
        var createdResponse = await _client.SendAsync(create);
        var created = await createdResponse.Content.ReadFromJsonAsync<SavingsGoalResponse>();
        var ownerGoals = await GetGoalsAsync(owner.Token);
        var otherGoals = await GetGoalsAsync(otherUser.Token);

        Assert.Equal(HttpStatusCode.OK, createdResponse.StatusCode);
        Assert.Equal(owner.UserId, created!.UserId);
        Assert.Single(ownerGoals);
        Assert.Empty(otherGoals);
    }

    [Fact]
    public async Task SavingsGoalContributionAndDeletionCannotCrossOwners()
    {
        var owner = await RegisterAsync();
        var otherUser = await RegisterAsync();
        var goal = await CreateGoalAsync(owner.Token, "Travel", 500);

        using var spoofedContribution = AuthenticatedRequest(
            HttpMethod.Post, $"/api/savingsgoals/{goal.Id}/contributions", otherUser.Token);
        spoofedContribution.Content = JsonContent.Create(new { userId = owner.UserId, amount = 10 });
        using var ownerContribution = AuthenticatedRequest(
            HttpMethod.Post, $"/api/savingsgoals/{goal.Id}/contributions", owner.Token);
        ownerContribution.Content = JsonContent.Create(new { amount = 25 });
        using var delete = AuthenticatedRequest(
            HttpMethod.Delete, $"/api/savingsgoals/{goal.Id}", otherUser.Token);

        Assert.Equal(HttpStatusCode.NotFound, (await _client.SendAsync(spoofedContribution)).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await _client.SendAsync(ownerContribution)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _client.SendAsync(delete)).StatusCode);
        Assert.Equal(25, Assert.Single(await GetGoalsAsync(owner.Token)).SavedAmount);
    }

    [Fact]
    public async Task BackupRestoreRequiresAuthentication()
    {
        var response = await _client.PostAsJsonAsync("/api/backups/restore", ValidBackup(DefaultPassword));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task BackupRestoreReplacesOnlyAuthenticatedUsersData()
    {
        var owner = await RegisterAsync();
        var otherUser = await RegisterAsync();
        await CreateTransactionAsync(owner.Token, "Old transaction", 10, "gider");
        await CreateGoalAsync(owner.Token, "Old goal", 100);
        await CreateTransactionAsync(otherUser.Token, "Other user's transaction", 15, "gelir");

        using var restore = AuthenticatedRequest(HttpMethod.Post, "/api/backups/restore", owner.Token);
        restore.Content = JsonContent.Create(ValidBackup(DefaultPassword));
        var response = await _client.SendAsync(restore);
        var restoredTransactions = await GetTransactionsAsync(owner.Token);
        var restoredGoals = await GetGoalsAsync(owner.Token);
        var untouchedTransactions = await GetTransactionsAsync(otherUser.Token);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("Restored transaction", Assert.Single(restoredTransactions).Description);
        Assert.Equal("Restored goal", Assert.Single(restoredGoals).Name);
        Assert.Equal("Other user's transaction", Assert.Single(untouchedTransactions).Description);
    }

    [Fact]
    public async Task BackupRestoreRejectsWrongPasswordWithoutReplacingData()
    {
        var owner = await RegisterAsync();
        await CreateTransactionAsync(owner.Token, "Keep this", 10, "gider");

        using var restore = AuthenticatedRequest(HttpMethod.Post, "/api/backups/restore", owner.Token);
        restore.Content = JsonContent.Create(ValidBackup("incorrect"));
        var response = await _client.SendAsync(restore);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Equal("Keep this", Assert.Single(await GetTransactionsAsync(owner.Token)).Description);
    }

    [Fact]
    public async Task SwaggerUiAndOpenApiDocumentAreAvailable()
    {
        var uiResponse = await _client.GetAsync("/swagger/index.html");
        var documentResponse = await _client.GetAsync("/swagger/v1/swagger.json");

        Assert.Equal(HttpStatusCode.OK, uiResponse.StatusCode);
        Assert.Equal(HttpStatusCode.OK, documentResponse.StatusCode);
    }

    [Fact]
    public async Task AuthenticationEndpointsAreRateLimited()
    {
        for (var attempt = 0; attempt < 5; attempt++)
        {
            var response = await _client.PostAsJsonAsync("/api/auth/login", new
            {
                username = NewUsername(),
                password = "invalid"
            });
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        var limitedResponse = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            username = NewUsername(),
            password = "invalid"
        });

        Assert.Equal(HttpStatusCode.TooManyRequests, limitedResponse.StatusCode);
    }

    private const string DefaultPassword = "correct horse battery staple";

    private async Task<AuthResponse> RegisterAsync(string? username = null, string? password = null)
    {
        var userName = username ?? NewUsername();
        var response = await _client.PostAsJsonAsync("/api/auth/register", new
        {
            username = userName,
            password = password ?? DefaultPassword
        });
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<AuthResponse>())!;
    }

    private async Task<TransactionResponse> CreateTransactionAsync(
        string token,
        string description,
        decimal amount,
        string type,
        int? spoofedUserId = null)
    {
        using var request = AuthenticatedRequest(HttpMethod.Post, "/api/transactions", token);
        request.Content = JsonContent.Create(new
        {
            userId = spoofedUserId,
            description,
            amount,
            type,
            category = "other"
        });
        var response = await _client.SendAsync(request);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<TransactionResponse>())!;
    }

    private async Task<SavingsGoalResponse> CreateGoalAsync(string token, string name, decimal targetAmount)
    {
        using var request = AuthenticatedRequest(HttpMethod.Post, "/api/savingsgoals", token);
        request.Content = JsonContent.Create(new { name, targetAmount });
        var response = await _client.SendAsync(request);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<SavingsGoalResponse>())!;
    }

    private async Task<TransactionResponse[]> GetTransactionsAsync(string token)
    {
        using var request = AuthenticatedRequest(HttpMethod.Get, "/api/transactions", token);
        var response = await _client.SendAsync(request);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<TransactionResponse[]>())!;
    }

    private async Task<SavingsGoalResponse[]> GetGoalsAsync(string token)
    {
        using var request = AuthenticatedRequest(HttpMethod.Get, "/api/savingsgoals", token);
        var response = await _client.SendAsync(request);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<SavingsGoalResponse[]>())!;
    }

    private static object ValidBackup(string password) => new
    {
        schemaVersion = 1,
        password,
        transactions = new[]
        {
            new
            {
                description = "Restored transaction",
                amount = 75,
                type = "gider",
                category = "groceries",
                createdAt = "2026-11-28T00:00:00.000Z"
            }
        },
        savingsGoals = new[]
        {
            new { name = "Restored goal", targetAmount = 500, savedAmount = 100 }
        }
    };

    private static HttpRequestMessage AuthenticatedRequest(HttpMethod method, string uri, string token)
    {
        var request = new HttpRequestMessage(method, uri);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return request;
    }

    private static string NewUsername() => $"test-{Guid.NewGuid():N}";

    private sealed record AuthResponse(string Token, int UserId, string Username);
    private sealed record TransactionResponse(int Id, int UserId, string Description, decimal Amount, string Type);
    private sealed record SavingsGoalResponse(int Id, int UserId, string Name, decimal TargetAmount, decimal SavedAmount);
}

internal sealed class BudgetApiFactory : WebApplicationFactory<Program>
{
    private readonly string _databasePath = Path.Combine(
        Path.GetTempPath(), $"budget-api-tests-{Guid.NewGuid():N}.db");

    public string DatabasePath => _databasePath;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration((_, configuration) =>
        {
            configuration.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:Budget"] = $"Data Source={_databasePath}"
            });
        });
    }
}
