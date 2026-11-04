using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Aseguradora.Api.Security;
using Aseguradora.Tests.Fixtures;
using Aseguradora.Tests.Support;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;

namespace Aseguradora.Tests.Api;

/// <summary>
/// RN20 integration tests (US-F1-07). The test controller has no rate limit attribute: the global
/// limiter must protect every route under <c>/api/publico/*</c> by itself (C15).
/// </summary>
public sealed class PublicoRateLimitTests
{
    private const string RutaPublica = "/api/publico/prueba-limite";
    private const string RutaPublicaNueva = "/api/publico/prueba-limite-2";
    private const string RutaFueraDelPrefijo = "/api/probe-limite";

    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    private static AseguradoraWebFactory CrearFactory(params (string Clave, string Valor)[] ajustes)
    {
        var factory = new AseguradoraWebFactory
        {
            ConfigurarServicios = (_, services) =>
                services.AddSingleton<IStartupFilter>(new TestRemoteIpStartupFilter())
        };

        foreach (var (clave, valor) in ajustes)
            factory.Ajustes[clave] = valor;

        return factory;
    }

    private static HttpClient CrearCliente(
        AseguradoraWebFactory factory, string ip, string? cfConnectingIp = null)
    {
        var cliente = factory.CreateClient();
        cliente.DefaultRequestHeaders.Add(TestRemoteIpStartupFilter.HeaderIp, ip);
        if (cfConnectingIp is not null)
            cliente.DefaultRequestHeaders.Add(ClientIpResolver.CabeceraCloudflare, cfConnectingIp);

        return cliente;
    }

    [Fact]
    public async Task Intento11_DesdeLaMismaIp_Responde429()
    {
        using var factory = CrearFactory();
        using var cliente = CrearCliente(factory, "203.0.113.10");

        for (var intento = 1; intento <= 10; intento++)
            Assert.Equal(HttpStatusCode.OK, (await cliente.GetAsync(RutaPublica)).StatusCode);

        var rechazada = await cliente.GetAsync(RutaPublica);

        Assert.Equal(HttpStatusCode.TooManyRequests, rechazada.StatusCode);
        Assert.Equal("application/problem+json", rechazada.Content.Headers.ContentType?.MediaType);
        var problema = await rechazada.Content.ReadFromJsonAsync<ProblemDetails>(Json);
        Assert.NotNull(problema);
        Assert.Equal(429, problema.Status);
    }

    [Fact]
    public async Task DosIps_TienenContadoresSeparados()
    {
        using var factory = CrearFactory();
        using var clienteA = CrearCliente(factory, "203.0.113.20");
        using var clienteB = CrearCliente(factory, "203.0.113.21");

        for (var intento = 1; intento <= 10; intento++)
            Assert.Equal(HttpStatusCode.OK, (await clienteA.GetAsync(RutaPublica)).StatusCode);

        Assert.Equal(HttpStatusCode.TooManyRequests, (await clienteA.GetAsync(RutaPublica)).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await clienteB.GetAsync(RutaPublica)).StatusCode);
    }

    [Fact]
    public async Task CfConnectingIp_DesdeRedConfiable_UsaEsaIp()
    {
        using var factory = CrearFactory(("ForwardedHeaders:RedesConfiables:0", "10.0.0.0/8"));
        using var cliente = CrearCliente(factory, "10.1.2.3", "198.51.100.7");

        for (var intento = 1; intento <= 10; intento++)
            Assert.Equal(HttpStatusCode.OK, (await cliente.GetAsync(RutaPublica)).StatusCode);

        Assert.Equal(HttpStatusCode.TooManyRequests, (await cliente.GetAsync(RutaPublica)).StatusCode);

        // Another real client behind the same tunnel has its own counter.
        using var otroCliente = CrearCliente(factory, "10.1.2.3", "198.51.100.8");
        Assert.Equal(HttpStatusCode.OK, (await otroCliente.GetAsync(RutaPublica)).StatusCode);
    }

    [Fact]
    public async Task CfConnectingIp_DesdeRedNoConfiable_SeIgnora()
    {
        using var factory = CrearFactory(("ForwardedHeaders:RedesConfiables:0", "10.0.0.0/8"));
        using var cliente = CrearCliente(factory, "192.168.1.50", "198.51.100.9");

        for (var intento = 1; intento <= 10; intento++)
            Assert.Equal(HttpStatusCode.OK, (await cliente.GetAsync(RutaPublica)).StatusCode);

        Assert.Equal(HttpStatusCode.TooManyRequests, (await cliente.GetAsync(RutaPublica)).StatusCode);

        // A different header from the same untrusted address still shares the remote-IP counter.
        using var otroCliente = CrearCliente(factory, "192.168.1.50", "198.51.100.10");
        Assert.Equal(HttpStatusCode.TooManyRequests, (await otroCliente.GetAsync(RutaPublica)).StatusCode);
    }

    [Fact]
    public async Task RutaNuevaBajoElPrefijo_QuedaLimitadaSinAtributo()
    {
        using var factory = CrearFactory();
        using var cliente = CrearCliente(factory, "203.0.113.30");

        for (var intento = 1; intento <= 10; intento++)
            Assert.Equal(HttpStatusCode.OK, (await cliente.GetAsync(RutaPublica)).StatusCode);

        var nueva = await cliente.GetAsync(RutaPublicaNueva);

        Assert.Equal(HttpStatusCode.TooManyRequests, nueva.StatusCode);
    }

    [Fact]
    public async Task RutaFueraDelPrefijo_NoSeLimita()
    {
        using var factory = CrearFactory();
        using var cliente = CrearCliente(factory, "203.0.113.40");

        for (var intento = 1; intento <= 15; intento++)
            Assert.Equal(HttpStatusCode.OK, (await cliente.GetAsync(RutaFueraDelPrefijo)).StatusCode);
    }

    [Fact]
    public async Task VentanaConfigurable_SeReinicia()
    {
        using var factory = CrearFactory(
            ("RateLimiting:Publico:PermitLimit", "2"),
            ("RateLimiting:Publico:WindowSeconds", "1"));
        using var cliente = CrearCliente(factory, "203.0.113.50");

        Assert.Equal(HttpStatusCode.OK, (await cliente.GetAsync(RutaPublica)).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await cliente.GetAsync(RutaPublica)).StatusCode);
        Assert.Equal(HttpStatusCode.TooManyRequests, (await cliente.GetAsync(RutaPublica)).StatusCode);

        await Task.Delay(TimeSpan.FromMilliseconds(1200));

        Assert.Equal(HttpStatusCode.OK, (await cliente.GetAsync(RutaPublica)).StatusCode);
    }
}
