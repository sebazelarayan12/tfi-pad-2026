using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Encodings.Web;
using Aseguradora.Application.Grupos;
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
    IOptions<ApiKeyOpciones> apiKeyOptions,
    GrupoExternoService grupos)
    : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    /// <summary>Name of the authentication scheme, shared with the ApiKey policy.</summary>
    public const string Esquema = "ApiKey";

    /// <summary>Header that carries the API key.</summary>
    public const string Header = "X-Api-Key";

    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.TryGetValue(Header, out var values))
            return AuthenticateResult.NoResult();

        var claveRecibida = values.ToString();
        if (string.IsNullOrWhiteSpace(claveRecibida))
            return AuthenticateResult.NoResult();

        var claims = new List<Claim>();
        var proveedor = BuscarProveedor(claveRecibida);
        if (proveedor is not null)
        {
            claims.Add(new Claim(ClaimsAseguradora.Proveedor, proveedor));
            claims.Add(new Claim(ClaimTypes.Name, proveedor));
        }
        else
        {
            var grupo = await BuscarGrupoAsync(claveRecibida);
            if (grupo is null)
                return AuthenticateResult.NoResult();

            // "grupo:<id>" can never equal a configured provider name (no ':' there), so a group
            // cannot pass for a payment provider whose name matches a webhook route.
            claims.Add(new Claim(ClaimsAseguradora.Proveedor, $"grupo:{grupo.Id}"));
            claims.Add(new Claim(ClaimsAseguradora.GrupoId, grupo.Id.ToString()));
            claims.Add(new Claim(ClaimTypes.Name, grupo.Nombre));
        }

        var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, Scheme.Name));
        return AuthenticateResult.Success(new AuthenticationTicket(principal, Scheme.Name));
    }

    private async Task<GrupoAutenticado?> BuscarGrupoAsync(string claveRecibida)
    {
        try
        {
            return await grupos.ValidarClaveAsync(claveRecibida, Context.RequestAborted);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            // A database failure must not turn into a 500 on every request that carries a key: it ends as 401.
            Logger.LogError(ex, "No se pudo validar la API key de un grupo.");
            return null;
        }
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
