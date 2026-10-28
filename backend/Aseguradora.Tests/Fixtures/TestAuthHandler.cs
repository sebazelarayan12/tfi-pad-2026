using System.Security.Claims;
using System.Text.Encodings.Web;
using Aseguradora.Application.Security;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Aseguradora.Tests.Fixtures;

/// <summary>
/// Stands in for the JWT handler under the <c>Bearer</c> scheme name, so the real policies still
/// apply. It reads the role from <see cref="HeaderRol"/> and issues no token. A missing header is
/// anonymous; a role the API does not define fails authentication (401).
/// </summary>
public sealed class TestAuthHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder)
    : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    public const string HeaderRol = "X-Test-Role";
    public const string HeaderUsuario = "X-Test-UserId";
    public const string UsuarioPorDefecto = "usuario-de-prueba";

    private static readonly string[] RolesValidos = [Roles.Administrador, Roles.Empleado];

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.TryGetValue(HeaderRol, out var rol))
            return Task.FromResult(AuthenticateResult.NoResult());

        if (!RolesValidos.Contains(rol.ToString()))
            return Task.FromResult(AuthenticateResult.Fail($"Unknown test role '{rol}'."));

        var usuario = Request.Headers.TryGetValue(HeaderUsuario, out var id) && !string.IsNullOrWhiteSpace(id)
            ? id.ToString()
            : UsuarioPorDefecto;

        var identidad = new ClaimsIdentity(
            [new Claim(ClaimTypes.NameIdentifier, usuario), new Claim(ClaimTypes.Role, rol.ToString())],
            Scheme.Name,
            ClaimTypes.Name,
            ClaimTypes.Role);

        var ticket = new AuthenticationTicket(new ClaimsPrincipal(identidad), Scheme.Name);
        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
