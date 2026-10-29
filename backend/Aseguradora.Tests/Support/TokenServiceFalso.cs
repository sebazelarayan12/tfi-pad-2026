using Aseguradora.Application.Security;

namespace Aseguradora.Tests.Support;

/// <summary>
/// Deterministic <see cref="ITokenService"/> for the unit tests of
/// <see cref="AutenticacionService"/>; no JWT is signed (C1, US-F1-03).
/// </summary>
public sealed class TokenServiceFalso : ITokenService
{
    public const string PrefijoToken = "token-de-prueba";

    public UsuarioCuenta? UsuarioRecibido { get; private set; }

    public string? RolRecibido { get; private set; }

    public TokenEmitido CrearToken(UsuarioCuenta usuario, string rol)
    {
        UsuarioRecibido = usuario;
        RolRecibido = rol;
        return new TokenEmitido($"{PrefijoToken}-{rol}", DateTimeOffset.UtcNow.AddHours(8));
    }
}
