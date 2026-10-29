namespace Aseguradora.Application.Security;

/// <summary>
/// Issues the JWT returned by <c>POST /api/auth/login</c> (CU01). The signing details (key,
/// issuer, audience, lifetime) belong to the API layer (US-F1-01).
/// </summary>
public interface ITokenService
{
    /// <summary>Creates a signed token for <paramref name="usuario"/> with the given role.</summary>
    TokenEmitido CrearToken(UsuarioCuenta usuario, string rol);
}

/// <summary>A signed JWT and the instant it expires, in UTC.</summary>
public sealed record TokenEmitido(string Token, DateTimeOffset ExpiraEn);
