using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace Aseguradora.Tests.Support;

/// <summary>
/// Shared test harness (C16): emits JWTs and API key headers that the real authentication accepts.
/// </summary>
public static class TokenDePrueba
{
    public const string ClaveJwt = "clave-de-prueba-para-jwt-con-mas-de-32-caracteres";
    public const string Emisor = "Aseguradora.Tests";
    public const string Audiencia = "Aseguradora.Tests";
    public const string ApiKeyHeader = "X-Api-Key";
    public const string ProveedorValido = "pasarela1";

    private static readonly IReadOnlyDictionary<string, string> ApiKeys = new Dictionary<string, string>
    {
        ["pasarela1"] = "api-key-de-prueba-pasarela1",
        ["pasarela2"] = "api-key-de-prueba-pasarela2"
    };

    /// <summary>
    /// Signs a JWT for the given role (or without a role when <paramref name="rol"/> is null).
    /// A negative <paramref name="vigencia"/> produces an already expired token.
    /// </summary>
    public static string Token(string? rol, TimeSpan? vigencia = null)
    {
        var ahora = DateTime.UtcNow;
        var expira = ahora.Add(vigencia ?? TimeSpan.FromMinutes(30));
        var inicio = expira < ahora ? expira.AddMinutes(-1) : ahora;

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, "usuario-de-prueba"),
            new(JwtRegisteredClaimNames.Email, "usuario@example.com")
        };
        if (rol is not null)
            claims.Add(new Claim(ClaimTypes.Role, rol));

        var credenciales = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(ClaveJwt)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: Emisor,
            audience: Audiencia,
            claims: claims,
            notBefore: inicio,
            expires: expira,
            signingCredentials: credenciales);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public static string ApiKeyValida(string proveedor) => ApiKeys[proveedor];

    public static IReadOnlyDictionary<string, string> ClavesApi() => ApiKeys;
}
