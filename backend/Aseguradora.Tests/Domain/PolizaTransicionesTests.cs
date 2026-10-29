using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Domain.Exceptions;
using Aseguradora.Tests.Builders;

namespace Aseguradora.Tests.Domain;

public class PolizaTransicionesTests
{
    private static readonly DateTime Fecha = new(2026, 10, 28, 12, 0, 0, DateTimeKind.Utc);

    private static Poliza PolizaEn(EstadoPoliza estado) =>
        new PolizaBuilder().Con(p => p.Estado = estado).Construir();

    private static Cuota CuotaEn(Poliza poliza, int numero, EstadoCuota estado)
    {
        var cuota = new CuotaBuilder().DePoliza(poliza).Numero(numero).Con(c => c.Estado = estado).Construir();
        poliza.Cuotas.Add(cuota);
        return cuota;
    }

    [Fact]
    public void Activar_DesdePendiente_PasaAVigente()
    {
        var poliza = PolizaEn(EstadoPoliza.Pendiente);

        poliza.Activar();

        Assert.Equal(EstadoPoliza.Vigente, poliza.Estado);
    }

    [Fact]
    public void Activar_DesdeVigente_Lanza()
    {
        var poliza = PolizaEn(EstadoPoliza.Vigente);

        Assert.Throws<TransicionInvalidaException>(poliza.Activar);
        Assert.Equal(EstadoPoliza.Vigente, poliza.Estado);
    }

    [Fact]
    public void Suspender_DesdeVigente()
    {
        var poliza = PolizaEn(EstadoPoliza.Vigente);

        poliza.Suspender();

        Assert.Equal(EstadoPoliza.Suspendida, poliza.Estado);
    }

    [Fact]
    public void Reactivar_SinCuotasVencidas()
    {
        var poliza = PolizaEn(EstadoPoliza.Suspendida);
        CuotaEn(poliza, 1, EstadoCuota.Pagada);
        CuotaEn(poliza, 2, EstadoCuota.Pendiente);

        poliza.Reactivar();

        Assert.Equal(EstadoPoliza.Vigente, poliza.Estado);
    }

    [Fact]
    public void Reactivar_ConCuotaVencida_Lanza()
    {
        var poliza = PolizaEn(EstadoPoliza.Suspendida);
        CuotaEn(poliza, 1, EstadoCuota.Vencida);

        Assert.Throws<TransicionInvalidaException>(poliza.Reactivar);
        Assert.Equal(EstadoPoliza.Suspendida, poliza.Estado);
    }

    [Theory]
    [InlineData(EstadoPoliza.Pendiente)]
    [InlineData(EstadoPoliza.Vigente)]
    [InlineData(EstadoPoliza.Suspendida)]
    public void Cancelar_DesdeEstadoActivo(EstadoPoliza origen)
    {
        var poliza = PolizaEn(origen);

        poliza.Cancelar("Pedido del cliente", Fecha);

        Assert.Equal(EstadoPoliza.Cancelada, poliza.Estado);
        Assert.Equal(Fecha, poliza.FechaCancelacion);
        Assert.Equal("Pedido del cliente", poliza.MotivoCancelacion);
    }

    [Theory]
    [InlineData(EstadoPoliza.Vencida)]
    [InlineData(EstadoPoliza.Cancelada)]
    public void Cancelar_DesdeVencida_Lanza(EstadoPoliza origen)
    {
        var poliza = PolizaEn(origen);

        Assert.Throws<TransicionInvalidaException>(() => poliza.Cancelar("Motivo", Fecha));
        Assert.Null(poliza.FechaCancelacion);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void Cancelar_MotivoVacio_Lanza(string? motivo)
    {
        var poliza = PolizaEn(EstadoPoliza.Vigente);

        Assert.Throws<ReglaDeDominioException>(() => poliza.Cancelar(motivo!, Fecha));
        Assert.Equal(EstadoPoliza.Vigente, poliza.Estado);
    }

    [Fact]
    public void Cancelar_MotivoDeMasDe200Caracteres_Lanza()
    {
        var poliza = PolizaEn(EstadoPoliza.Vigente);

        Assert.Throws<ReglaDeDominioException>(() => poliza.Cancelar(new string('x', 201), Fecha));
        poliza.Cancelar(new string('x', 200), Fecha);
        Assert.Equal(EstadoPoliza.Cancelada, poliza.Estado);
    }

    [Fact]
    public void Cancelar_AnulaImpagasYConservaPagadas()
    {
        var poliza = PolizaEn(EstadoPoliza.Vigente);
        var pagada = CuotaEn(poliza, 1, EstadoCuota.Pagada);
        var vencida = CuotaEn(poliza, 2, EstadoCuota.Vencida);
        var pendiente = CuotaEn(poliza, 3, EstadoCuota.Pendiente);

        poliza.Cancelar("Pedido del cliente", Fecha);

        Assert.Equal(EstadoCuota.Pagada, pagada.Estado);
        Assert.Equal(EstadoCuota.Anulada, vencida.Estado);
        Assert.Equal(EstadoCuota.Anulada, pendiente.Estado);
    }

    [Theory]
    [InlineData(EstadoPoliza.Vigente)]
    [InlineData(EstadoPoliza.Suspendida)]
    public void Vencer_DesdeVigente(EstadoPoliza origen)
    {
        var poliza = PolizaEn(origen);

        poliza.Vencer();

        Assert.Equal(EstadoPoliza.Vencida, poliza.Estado);
    }

    [Theory]
    [InlineData(EstadoPoliza.Pendiente)]
    [InlineData(EstadoPoliza.Cancelada)]
    [InlineData(EstadoPoliza.Vencida)]
    public void Vencer_DesdePendiente_Lanza(EstadoPoliza origen)
    {
        var poliza = PolizaEn(origen);

        Assert.Throws<TransicionInvalidaException>(poliza.Vencer);
    }

    [Theory]
    [InlineData(EstadoPoliza.Pendiente, false)]
    [InlineData(EstadoPoliza.Vigente, true)]
    [InlineData(EstadoPoliza.Suspendida, false)]
    [InlineData(EstadoPoliza.Cancelada, false)]
    [InlineData(EstadoPoliza.Vencida, false)]
    public void DaCobertura_SoloVigente(EstadoPoliza estado, bool esperado)
    {
        Assert.Equal(esperado, PolizaEn(estado).DaCobertura);
    }
}
