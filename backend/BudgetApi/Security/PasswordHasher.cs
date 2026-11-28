using System.Security.Cryptography;
using System.Text;
using BudgetApi.Models;
using Microsoft.AspNetCore.Identity;

namespace BudgetApi.Security;

public sealed class PasswordHasher
{
    private readonly IPasswordHasher<User> _passwordHasher;

    public PasswordHasher(IPasswordHasher<User> passwordHasher)
    {
        _passwordHasher = passwordHasher;
    }

    public string Hash(User user, string password)
    {
        return _passwordHasher.HashPassword(user, password);
    }

    public PasswordVerificationResult Verify(User user, string password)
    {
        var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, password);
        if (result != PasswordVerificationResult.Failed)
            return result;

        return VerifyLegacyPassword(password, user.PasswordHash)
            ? PasswordVerificationResult.SuccessRehashNeeded
            : PasswordVerificationResult.Failed;
    }

    private static bool VerifyLegacyPassword(string password, string storedHash)
    {
        byte[] expectedHash;
        try
        {
            expectedHash = Convert.FromBase64String(storedHash);
        }
        catch (FormatException)
        {
            return false;
        }

        if (expectedHash.Length != 32)
            return false;

        var actualHash = SHA256.HashData(Encoding.UTF8.GetBytes(password));
        return CryptographicOperations.FixedTimeEquals(actualHash, expectedHash);
    }
}
