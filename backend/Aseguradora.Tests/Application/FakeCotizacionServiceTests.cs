using Aseguradora.Application.Exceptions;
using Aseguradora.Tests.Fakes;

namespace Aseguradora.Tests.Application;

public class FakeCotizacionServiceTests
{
    private static readonly DateTime AhoraDePrueba = new(2026, 10, 28, 12, 0, 0, DateTimeKind.Utc);

    [Fact]
    public async Task ObtenerAsync_con_id_conocido_devuelve_la_cotizacion()
    {
        var service = new FakeCotizacionService();

        var vigente = await service.ObtenerAsync(FakeCotizacionService.CotizacionVigenteId, CancellationToken.None);
        var vencida = await service.ObtenerAsync(FakeCotizacionService.CotizacionVencidaId, CancellationToken.None);

        Assert.Equal(FakeCotizacionService.CotizacionVigenteId, vigente.Id);
        Assert.True(vigente.EstaVigente(AhoraDePrueba));

        Assert.Equal(FakeCotizacionService.CotizacionVencidaId, vencida.Id);
        Assert.False(vencida.EstaVigente(AhoraDePrueba));
    }

    [Fact]
    public async Task ObtenerAsync_con_id_desconocido_lanza_NotFoundException()
    {
        var service = new FakeCotizacionService();

        await Assert.ThrowsAsync<NotFoundException>(
            () => service.ObtenerAsync(Guid.NewGuid(), CancellationToken.None));
    }
}
