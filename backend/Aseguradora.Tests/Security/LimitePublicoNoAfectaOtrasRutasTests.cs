using System.Net;
using System.Net.Http.Json;
using Aseguradora.Tests.Fixtures;

namespace Aseguradora.Tests.Security;

/// <summary>
/// RN20 limits only <c>/api/publico/*</c>. When the client IP is unknown (no remote address), the other
/// routes must not fall into the public window.
/// </summary>
public class LimitePublicoNoAfectaOtrasRutasTests
{
    [Fact]
    public async Task Agotar_el_limite_publico_sin_ip_conocida_no_limita_las_otras_rutas()
    {
        await using var factory = new AseguradoraWebFactory();
        var cliente = factory.CreateClient();

        HttpStatusCode ultimo = default;
        for (var i = 0; i < 12; i++)
        {
            ultimo = (await cliente.PostAsJsonAsync(
                "/api/publico/grupos/login", new { email = "a@example.com", password = "x" })).StatusCode;
        }
        Assert.Equal(HttpStatusCode.TooManyRequests, ultimo);

        for (var i = 0; i < 12; i++)
            // /health answers 503 here (no database); what matters is that the public window does not apply.
            Assert.NotEqual(HttpStatusCode.TooManyRequests, (await cliente.GetAsync("/health")).StatusCode);
    }
}
