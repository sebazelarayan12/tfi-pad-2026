using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Domain.Exceptions;

namespace Aseguradora.Tests.Pagos;

public class PagoTests
{
    [Fact]
    public void CrearPendienteSumaImporteYRecargo()
    {
        var cuota = new Cuota { Importe = 100m, Recargo = 5m };
        var pago = Pago.CrearPendiente(Guid.NewGuid(), "PAG-1", MedioPago.Caja, [cuota], DateTime.UtcNow);
        Assert.Equal(105m, pago.ImporteTotal);
        Assert.Equal(105m, Assert.Single(pago.PagoCuotas).Importe);
        Assert.Equal(EstadoPago.Pendiente, pago.Estado);
    }

    [Fact]
    public void AprobarNormalizaFechaUtcYNoPermiteOtraTransicion()
    {
        var pago = new Pago();
        pago.Aprobar(new DateTime(2026, 11, 8, 12, 0, 0, DateTimeKind.Local));
        Assert.Equal(EstadoPago.Aprobado, pago.Estado);
        Assert.Equal(DateTimeKind.Utc, pago.FechaAcreditacion!.Value.Kind);
        Assert.Throws<TransicionInvalidaException>(() => pago.Aprobar(DateTime.UtcNow));
        Assert.Throws<TransicionInvalidaException>(() => pago.Rechazar());
    }

    [Fact]
    public void RechazarSoloDesdePendiente()
    {
        var pago = new Pago();
        pago.Rechazar();
        Assert.Equal(EstadoPago.Rechazado, pago.Estado);
        Assert.Throws<TransicionInvalidaException>(() => pago.Rechazar());
        Assert.Throws<TransicionInvalidaException>(() => pago.Aprobar(DateTime.UtcNow));
    }

    [Fact]
    public void FechaSinZonaNoAprueba()
    {
        var pago = new Pago();
        Assert.Throws<ReglaDeDominioException>(() => pago.Aprobar(new DateTime(2026, 11, 8)));
        Assert.Equal(EstadoPago.Pendiente, pago.Estado);
    }
}
