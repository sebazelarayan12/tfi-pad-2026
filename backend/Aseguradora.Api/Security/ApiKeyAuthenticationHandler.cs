using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;

namespace Aseguradora.Api.Security;

/// <summary>
/// Authenticates external systems with the <c>X-Api-Key</c> header. A valid key yields a principal
/// with the <see cref="ClaimsAseguradora.Proveedor"/> claim (the configured key name); a missing or
/// wrong key yields no result, so the request ends as 401.
/// </summary>
public sealed class ApiKeyAuthenticationHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder,
    IOptions<ApiKeyOpciones> apiKeyOptions)
    : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    /// <summary>Name of the authentication scheme, shared with the ApiKey policy.</summary>
    public const string Esquema = "ApiKey";

    /// <summary>Header that carries the API key.</summary>
    public const string Header = "X-Api-Key";

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.TryGetValue(Header, out var values))
            return Task.FromResult(AuthenticateResult.NoResult());

        var claveRecibida = values.ToString();
        if (string.IsNullOrWhiteSpace(claveRecibida))
            return Task.FromResult(AuthenticateResult.NoResult());

        var proveedor = BuscarProveedor(claveRecibida);
        if (proveedor is null)
            return Task.FromResult(AuthenticateResult.NoResult());

        var claims = new[]
        {
            new Claim(ClaimsAseguradora.Proveedor, proveedor),
            new Claim(ClaimTypes.Name, proveedor)
        };

        var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, Scheme.Name));
        return Task.FromResult(AuthenticateResult.Success(new AuthenticationTicket(principal, Scheme.Name)));
    }

    private string? BuscarProveedor(string claveRecibida)
    {
        var claveRecibidaBytes = Encoding.UTF8.GetBytes(claveRecibida);
        string? proveedor = null;

        // Every configured key is compared in constant time, even after a match, so the
        // response time does not reveal which provider the key belongs to.
        foreach (var (nombre, clave) in apiKeyOptions.Value.ApiKeys)
        {
            if (CryptographicOperations.FixedTimeEquals(claveRecibidaBytes, Encoding.UTF8.GetBytes(clave)))
                proveedor = nombre;
        }

        return proveedor;
    }
}
