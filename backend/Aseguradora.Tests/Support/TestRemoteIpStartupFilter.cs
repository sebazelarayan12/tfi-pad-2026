using System.Net;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;

namespace Aseguradora.Tests.Support;

/// <summary>
/// Test-only startup filter that sets <see cref="HttpContext.Connection"/>'s remote address from a
/// header, because TestServer has no network connection. It runs before the API pipeline, so the
/// public rate limiter sees the simulated client IP.
/// </summary>
public sealed class TestRemoteIpStartupFilter : IStartupFilter
{
    public const string HeaderIp = "X-Test-IP";

    public Action<IApplicationBuilder> Configure(Action<IApplicationBuilder> next)
    {
        ArgumentNullException.ThrowIfNull(next);

        return app =>
        {
            app.Use(async (contexto, siguiente) =>
            {
                if (contexto.Request.Headers.TryGetValue(HeaderIp, out var valor)
                    && IPAddress.TryParse(valor.ToString(), out var ip))
                {
                    contexto.Connection.RemoteIpAddress = ip;
                }

                await siguiente(contexto);
            });

            next(app);
        };
    }
}
