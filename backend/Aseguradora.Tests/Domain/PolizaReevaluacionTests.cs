using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Tests.Builders;

namespace Aseguradora.Tests.Domain;

public class PolizaReevaluacionTests
{
    private static Poliza PolizaEn(EstadoPoliza estado) =>
        new PolizaBuilder().Con(p => p.Estado = estado).Construir();

    private static Cuota Cuota(int numero, EstadoCuota estado) =>
        new CuotaBuilder().Numero(numero).Con(c => c.Estado = estado).Construir();

    [Fact]
    public void ReevaluarEstado_CuotaUnoPagada_ActivaPendiente()
    {
        var poliza = PolizaEn(EstadoPoliza.Pendiente);

        poliza.ReevaluarEstado([Cuota(1, EstadoCuota.Pagada), Cuota(2, EstadoCuota.Pendiente)]);

        Assert.Equal(EstadoPoliza.Vigente, poliza.Estado);
    }

    [Fact]
    public void ReevaluarEstado_SuspendidaSinVencidas_Reactiva()
    {
        var poliza = PolizaEn(EstadoPoliza.Suspendida);

        poliza.ReevaluarEstado([Cuota(1, EstadoCuota.Pagada), Cuota(2, EstadoCuota.Pagada), Cuota(3, EstadoCuota.Pendiente)]);

        Assert.Equal(EstadoPoliza.Vigente, poliza.Estado);
    }

    [Fact]
    public void ReevaluarEstado_SuspendidaConVencida_SigueSuspendida()
    {
        var poliza = PolizaEn(EstadoPoliza.Suspendida);

        poliza.ReevaluarEstado([Cuota(1, EstadoCuota.Pagada), Cuota(2, EstadoCuota.Vencida)]);

        Assert.Equal(EstadoPoliza.Suspendida, poliza.Estado);
    }

    [Theory]
    [InlineData(EstadoPoliza.Pendiente)]
    [InlineData(EstadoPoliza.Vigente)]
    [InlineData(EstadoPoliza.Cancelada)]
    [InlineData(EstadoPoliza.Vencida)]
    public void ReevaluarEstado_SinCambiosAplicables_NoTocaEstado(EstadoPoliza estado)
    {
        var poliza = PolizaEn(estado);

        // The first installment is unpaid, and the policy is not Suspendida: nothing applies.
        poliza.ReevaluarEstado([Cuota(1, EstadoCuota.Pendiente), Cuota(2, EstadoCuota.Pagada)]);

        Assert.Equal(estado, poliza.Estado);
    }
}
