using System.Net;

namespace Aseguradora.Api.Security;

/// <summary>
/// Resolves the client IP used to partition the public rate limiter (RN20). It reads
/// <c>CF-Connecting-IP</c> only when the connection comes from a trusted network, because behind
/// the Cloudflare Tunnel the API sees cloudflared's address instead of the client's (11.4).
/// </summary>
public sealed class ClientIpResolver
{
    /// <summary>Header Cloudflare adds with the original client address.</summary>
    public const string CabeceraCloudflare = "CF-Connecting-IP";

    /// <summary>Partition shared by every request without a remote address (for example TestServer).</summary>
    public const string ParticionDesconocida = "desconocida";

    /// <summary>Configuration section that lists the networks allowed to send the Cloudflare header.</summary>
    public const string SeccionRedesConfiables = "ForwardedHeaders:RedesConfiables";

    private readonly IReadOnlyList<IPNetwork> _redesConfiables;

    public ClientIpResolver(IEnumerable<IPNetwork> redesConfiables)
    {
        ArgumentNullException.ThrowIfNull(redesConfiables);
        _redesConfiables = redesConfiables.ToList();
    }

    /// <summary>
    /// Returns the address that identifies the client for the rate limit: the remote address, or
    /// <c>CF-Connecting-IP</c> when the remote address belongs to a trusted network.
    /// </summary>
    public string ObtenerIp(HttpContext context)
    {
        ArgumentNullException.ThrowIfNull(context);

        var remota = Normalizar(context.Connection.RemoteIpAddress);
        if (remota is null)
            return ParticionDesconocida;

        if (EsRedConfiable(remota)
            && IPAddress.TryParse(context.Request.Headers[CabeceraCloudflare].ToString(), out var ipCloudflare)
            && ipCloudflare is not null)
        {
            return Normalizar(ipCloudflare)!.ToString();
        }

        return remota.ToString();
    }

    /// <summary>Reads <c>ForwardedHeaders:RedesConfiables</c> as CIDR blocks. Empty by default.</summary>
    public static IReadOnlyList<IPNetwork> LeerRedesConfiables(IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        var valores = configuration.GetSection(SeccionRedesConfiables).Get<string[]>() ?? [];
        var redes = new List<IPNetwork>(valores.Length);

        foreach (var valor in valores)
        {
            if (string.IsNullOrWhiteSpace(valor))
                continue;
            if (!IPNetwork.TryParse(valor.Trim(), out var red))
                throw new InvalidOperationException(
                    $"La red confiable '{valor}' de {SeccionRedesConfiables} no es un bloque CIDR válido.");

            redes.Add(red);
        }

        return redes;
    }

    private bool EsRedConfiable(IPAddress ip) =>
        _redesConfiables.Any(red =>
            red.BaseAddress.AddressFamily == ip.AddressFamily && red.Contains(ip));

    // Kestrel may report IPv4 clients as IPv4-mapped IPv6 (::ffff:a.b.c.d); use the IPv4 form so the
    // partition and the configured IPv4 networks match.
    private static IPAddress? Normalizar(IPAddress? ip) =>
        ip is null ? null : ip.IsIPv4MappedToIPv6 ? ip.MapToIPv4() : ip;
}
