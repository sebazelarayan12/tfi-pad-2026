using Aseguradora.Application.Dtos;
using Aseguradora.Domain.Enums;

namespace Aseguradora.Tests.Application;

public class CotizacionDtoTests
{
    private static readonly DateTime Vencimiento = new(2026, 11, 12, 18, 30, 0, DateTimeKind.Utc);

    private static CotizacionDto CrearCotizacion() => new(
        Id: Guid.NewGuid(),
        PlanId: Guid.NewGuid(),
        CodigoPlan: "RC",
        ClienteId: Guid.NewGuid(),
        VehiculoId: Guid.NewGuid(),
        PrimaMensual: 12000.00m,
        FechaCotizacion: new DateTime(2026, 10, 28, 18, 30, 0, DateTimeKind.Utc),
        FechaVencimiento: Vencimiento,
        Origen: OrigenCotizacion.Panel);

    [Fact]
    public void EstaVigente_es_true_hasta_la_fecha_de_vencimiento_inclusive()
    {
        var cotizacion = CrearCotizacion();

        Assert.True(cotizacion.EstaVigente(Vencimiento.AddDays(-1)));
        Assert.True(cotizacion.EstaVigente(Vencimiento));
    }

    [Fact]
    public void EstaVigente_es_false_despues_del_vencimiento()
    {
        var cotizacion = CrearCotizacion();

        Assert.False(cotizacion.EstaVigente(Vencimiento.AddTicks(1)));
        Assert.False(cotizacion.EstaVigente(Vencimiento.AddDays(1)));
    }
}
