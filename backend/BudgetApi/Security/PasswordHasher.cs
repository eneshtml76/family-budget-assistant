using System.Security.Cryptography;
using System.Text;

namespace BudgetApi.Security;

public static class PasswordHasher
{
    public static string Hash(string password)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(bytes);
    }

    public static bool Verify(string password, string expectedHash)
    {
        var actualBytes = Convert.FromBase64String(Hash(password));
        var expectedBytes = Convert.FromBase64String(expectedHash);
        return actualBytes.Length == expectedBytes.Length &&
            CryptographicOperations.FixedTimeEquals(actualBytes, expectedBytes);
    }
}
