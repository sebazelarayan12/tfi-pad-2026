using Aseguradora.Application.Dtos;
using Aseguradora.Application.External;
using Aseguradora.Application.Exceptions;
using Aseguradora.Integrations.Arca;
using Aseguradora.Integrations.Pasarela;
using Aseguradora.Integrations.Pagos;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
namespace Aseguradora.Tests.Pagos;
public class PasarelaResolverTests
{
    [Fact]
    public async Task PasarelasSonIndependientesYConservanEstado()
    {
        using var provider = new ServiceCollection().AddPagosIntegrations(new ConfigurationBuilder().Build()).BuildServiceProvider();
        var resolver = provider.GetRequiredService<IPasarelaResolver>();
        var uno = resolver.Obtener("pasarela1");
        var dos = resolver.Obtener("pasarela2");
        Assert.IsType<PasarelaMockService>(uno);
        Assert.IsType<PasarelaMockService>(dos);
        Assert.NotSame(uno, dos);
        Assert.Throws<NotFoundException>(() => resolver.Obtener("otra"));
        var pago = await uno.CrearPagoAsync(new("PAG-1", 100m, "ARS", "Cuota", new("Cliente", "30123456", "test@example.com"),
            "https://example.com/exito", "https://example.com/error", "https://example.com/webhook"), default);
        Assert.Equal("PSR-PAG-1", pago.IdPago);
        Assert.False(string.IsNullOrWhiteSpace(pago.UrlPago));
        Assert.Equal("PENDIENTE", (await uno.ConsultarPagoAsync(pago.IdPago, default)).Estado);
        await Assert.ThrowsAsync<NotFoundException>(() => dos.ConsultarPagoAsync(pago.IdPago, default));
        Assert.IsType<ArcaMockService>(provider.GetRequiredService<IArcaService>());
    }
}
