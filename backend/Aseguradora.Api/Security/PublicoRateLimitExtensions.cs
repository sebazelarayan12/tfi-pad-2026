using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.WebUtilities;

namespace Aseguradora.Api.Security;

/// <summary>
/// RN20: every request under <c>/api/publico/*</c> is limited to 10 attempts per minute per IP
/// (C15). The limit is a global limiter partitioned by path prefix, so a new public controller or
/// action is covered without adding <c>[EnableRateLimiting]</c>.
/// </summary>
public static class PublicoRateLimitExtensions
{
    /// <summary>Path prefix that RN20 protects.</summary>
    public const string PrefijoPublico = "/api/publico";

    public const int PermitLimitPorDefecto = 10;
    public const int VentanaSegundosPorDefecto = 60;

    public const string ClavePermitLimit = "RateLimiting:Publico:PermitLimit";
    public const string ClaveWindowSeconds = "RateLimiting:Publico:WindowSeconds";

    private const string ProblemJson = "application/problem+json";
    private const string DetalleRechazo = "Se superó el límite de intentos. Volvé a intentarlo en un minuto.";

    /// <summary>
    /// Registers the rate limiter middleware, its 429 response and the global limiter for the public
    /// prefix. Call <c>app.UseRateLimiter()</c> before <c>UseAuthentication()</c>.
    /// </summary>
    public static IServiceCollection AddPublicoRateLimit(this IServiceCollection services, IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);

        var permitLimit = configuration.GetValue<int?>(ClavePermitLimit) ?? PermitLimitPorDefecto;
        var ventanaSegundos = configuration.GetValue<int?>(ClaveWindowSeconds) ?? VentanaSegundosPorDefecto;

        if (permitLimit <= 0)
            throw new InvalidOperationException($"{ClavePermitLimit} debe ser mayor que cero.");
        if (ventanaSegundos <= 0)
            throw new InvalidOperationException($"{ClaveWindowSeconds} debe ser mayor que cero.");

        var resolutor = new ClientIpResolver(ClientIpResolver.LeerRedesConfiables(configuration));
        services.AddSingleton(resolutor);

        services.AddRateLimiter(opciones =>
        {
            // ASP.NET answers 503 by default; RN20 requires 429.
            opciones.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            opciones.OnRejected = EscribirRechazoAsync;

            opciones.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(contexto =>
            {
                if (!contexto.Request.Path.StartsWithSegments(PrefijoPublico, StringComparison.OrdinalIgnoreCase))
                    return RateLimitPartition.GetNoLimiter(ClientIpResolver.ParticionDesconocida);

                var ip = resolutor.ObtenerIp(contexto);
                return RateLimitPartition.GetFixedWindowLimiter(ip, _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = permitLimit,
                    Window = TimeSpan.FromSeconds(ventanaSegundos),
                    // No queue: the request over the limit is rejected immediately instead of waiting.
                    QueueLimit = 0,
                    QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                    AutoReplenishment = true
                });
            });
        });

        return services;
    }

    private static async ValueTask EscribirRechazoAsync(OnRejectedContext contexto, CancellationToken cancellationToken)
    {
        var http = contexto.HttpContext;
        var problema = new ProblemDetails
        {
            Status = StatusCodes.Status429TooManyRequests,
            Title = ReasonPhrases.GetReasonPhrase(StatusCodes.Status429TooManyRequests),
            Detail = DetalleRechazo,
            Instance = http.Request.Path
        };
        problema.Extensions["traceId"] = http.TraceIdentifier;

        http.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        await http.Response.WriteAsJsonAsync(
            problema, options: null, contentType: ProblemJson, cancellationToken: cancellationToken);
    }
}
