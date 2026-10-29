using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Domain.Exceptions;
using Aseguradora.Tests.Builders;

namespace Aseguradora.Tests.Domain;

public class CuotaTests
{
    private static readonly DateOnly Vencimiento = new(2026, 11, 10);
    private static readonly DateTime FechaPago = new(2026, 11, 5, 12, 0, 0, DateTimeKind.Utc);

    private static Cuota CuotaEn(EstadoCuota estado, decimal importe = 25000.00m) =>
        new CuotaBuilder()
            .Con(c =>
            {
                c.Estado = estado;
                c.Importe = importe;
                c.FechaVencimiento = Vencimiento;
            })
            .Construir();

    [Fact]
    public void Vencer_DespuesDelVencimiento_AplicaRecargo5()
    {
        var cuota = CuotaEn(EstadoCuota.Pendiente);

        cuota.Vencer(Vencimiento.AddDays(1));

        Assert.Equal(EstadoCuota.Vencida, cuota.Estado);
        Assert.Equal(1250.00m, cuota.Recargo);
    }

    [Fact]
    public void Vencer_MismoDia_NoVence()
    {
        var cuota = CuotaEn(EstadoCuota.Pendiente);

        cuota.Vencer(Vencimiento);

        Assert.Equal(EstadoCuota.Pendiente, cuota.Estado);
        Assert.Equal(0m, cuota.Recargo);
    }

    [Fact]
    public void Vencer_YaVencida_NoRecalculaRecargo()
    {
        var cuota = CuotaEn(EstadoCuota.Pendiente);
        cuota.Vencer(Vencimiento.AddDays(1));

        cuota.Vencer(Vencimiento.AddDays(30));

        Assert.Equal(EstadoCuota.Vencida, cuota.Estado);
        Assert.Equal(1250.00m, cuota.Recargo);
    }

    [Fact]
    public void Vencer_RedondeaElRecargoADosDecimales()
    {
        var cuota = CuotaEn(EstadoCuota.Pendiente, importe: 100.10m);

        cuota.Vencer(Vencimiento.AddDays(1));

        Assert.Equal(5.01m, cuota.Recargo);
    }

    [Theory]
    [InlineData(EstadoCuota.Pendiente)]
    [InlineData(EstadoCuota.Vencida)]
    public void Pagar_DesdePendienteOVencida_PasaAPagadaConFecha(EstadoCuota origen)
    {
        var cuota = CuotaEn(origen);

        cuota.Pagar(FechaPago);

        Assert.Equal(EstadoCuota.Pagada, cuota.Estado);
        Assert.Equal(FechaPago, cuota.FechaPago);
    }

    [Theory]
    [InlineData(EstadoCuota.Anulada)]
    [InlineData(EstadoCuota.Pagada)]
    public void Pagar_DesdeAnulada_Lanza(EstadoCuota origen)
    {
        var cuota = CuotaEn(origen);

        Assert.Throws<TransicionInvalidaException>(() => cuota.Pagar(FechaPago));
        Assert.Equal(origen, cuota.Estado);
    }

    [Theory]
    [InlineData(EstadoCuota.Pendiente)]
    [InlineData(EstadoCuota.Vencida)]
    public void Anular_DesdeImpaga_PasaAAnulada(EstadoCuota origen)
    {
        var cuota = CuotaEn(origen);

        cuota.Anular();

        Assert.Equal(EstadoCuota.Anulada, cuota.Estado);
    }

    [Theory]
    [InlineData(EstadoCuota.Pagada)]
    [InlineData(EstadoCuota.Anulada)]
    public void Anular_DesdePagada_Lanza(EstadoCuota origen)
    {
        var cuota = CuotaEn(origen);

        Assert.Throws<TransicionInvalidaException>(cuota.Anular);
    }
}
