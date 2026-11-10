using System.Security.Cryptography;
using System.Text;

namespace Aseguradora.Application.Grupos;

/// <summary>
/// API keys issued to external groups. The plain value exists only in the response that creates it;
/// the database keeps its SHA-256, which is enough because the key is 256 random bits (a slow hash
/// adds nothing and would cost time on every request).
/// </summary>
public static class ClaveApi
{
    /// <summary>Every key issued here starts with it, so the API can tell it from a configured key.</summary>
    public const string Prefijo = "nxk_";

    /// <summary>Characters of the key that are kept in the clear, to tell keys apart.</summary>
    public const int LongitudPrefijoVisible = 8;

    private const int BytesAleatorios = 32;

    /// <summary>A new random key: <see cref="Prefijo"/> followed by 43 URL-safe characters.</summary>
    public static string Generar()
    {
        var bytes = RandomNumberGenerator.GetBytes(BytesAleatorios);
        var texto = Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
        return Prefijo + texto;
    }

    /// <summary>Lowercase hexadecimal SHA-256 of the key.</summary>
    public static string Hash(string clave)
    {
        ArgumentNullException.ThrowIfNull(clave);
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(clave))).ToLowerInvariant();
    }

    /// <summary>The visible start of the key.</summary>
    public static string PrefijoVisible(string clave) => clave[..LongitudPrefijoVisible];
}
