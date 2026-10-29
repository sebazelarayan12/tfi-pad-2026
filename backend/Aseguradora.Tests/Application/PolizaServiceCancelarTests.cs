using Aseguradora.Application.Dtos.Polizas;
using Aseguradora.Application.Exceptions;
using Aseguradora.Data.Seed;
using Aseguradora.Domain.Enums;
using Aseguradora.Domain.Exceptions;
using Aseguradora.Tests.Data;
using Aseguradora.Tests.Support;
using Microsoft.EntityFrameworkCore;

namespace Aseguradora.Tests.Application;

public sealed class PolizaServiceCancelarTests : IDisposable
{
    private readonly SqliteDbFixture _fixture = new();

    public void Dispose() => _fixture.Dispose();

    [Fact]
    public async Task Cancelar_Vigente_AnulaLasCuotasImpagasYGuardaElMotivo()
    {
        await using (var context = _fixture.CreateContext())
        {
            var poliza = await PolizasDePrueba.CrearServicio(context)
                .CancelarAsync(SeedData.PolizaId, new CancelarPolizaRequest { Motivo = "  Venta del vehículo  " });

            Assert.Equal(EstadoPoliza.Cancelada, poliza.Estado);
            Assert.Equal(EstadoCuota.Pagada, poliza.Cuotas[0].Estado);
            Assert.All(poliza.Cuotas.Skip(1), c => Assert.Equal(EstadoCuota.Anulada, c.Estado));
        }

        // RN13: the paid installment stays paid; the rest are voided, and everything is saved.
        await using var verificacion = _fixture.CreateContext();
        var guardada = await verificacion.Polizas.Include(p => p.Cuotas).SingleAsync(p => p.Id == SeedData.PolizaId);
        Assert.Equal(EstadoPoliza.Cancelada, guardada.Estado);
        Assert.Equal("Venta del vehículo", guardada.MotivoCancelacion);
        Assert.Equal(PolizasDePrueba.Ahora.UtcDateTime, guardada.FechaCancelacion);
        Assert.Equal(1, guardada.Cuotas.Count(c => c.Estado == EstadoCuota.Pagada));
        Assert.Equal(5, guardada.Cuotas.Count(c => c.Estado == EstadoCuota.Anulada));
    }

    [Fact]
    public async Task Cancelar_CuotaVencida_TambienSeAnula()
    {
        await using (var context = _fixture.CreateContext())
        {
            var cuota = await context.Cuotas.SingleAsync(c => c.Id == SeedData.CuotaId(2));
            cuota.Estado = EstadoCuota.Vencida;
            await context.SaveChangesAsync();
        }

        await using (var context = _fixture.CreateContext())
            await PolizasDePrueba.CrearServicio(context)
                .CancelarAsync(SeedData.PolizaId, new CancelarPolizaRequest { Motivo = "Falta de pago" });

        await using var verificacion = _fixture.CreateContext();
        var cuotaVencida = await verificacion.Cuotas.SingleAsync(c => c.Id == SeedData.CuotaId(2));
        Assert.Equal(EstadoCuota.Anulada, cuotaVencida.Estado);
    }

    [Theory]
    [InlineData(EstadoPoliza.Vencida)]
    [InlineData(EstadoPoliza.Cancelada)]
    public async Task Cancelar_PolizaVencidaOCancelada_LanzaYNoGuardaNada(EstadoPoliza estado)
    {
        Guid polizaId;
        await using (var context = _fixture.CreateContext())
            polizaId = (await PolizasDePrueba.AgregarPolizaAsync(context, estado, PolizasDePrueba.Ahora.UtcDateTime)).Id;

        await using (var context = _fixture.CreateContext())
            await Assert.ThrowsAsync<TransicionInvalidaException>(() => PolizasDePrueba.CrearServicio(context)
                .CancelarAsync(polizaId, new CancelarPolizaRequest { Motivo = "Pedido del cliente" }));

        await using var verificacion = _fixture.CreateContext();
        var guardada = await verificacion.Polizas.Include(p => p.Cuotas).SingleAsync(p => p.Id == polizaId);
        Assert.Equal(estado, guardada.Estado);
        Assert.Null(guardada.MotivoCancelacion);
        Assert.All(guardada.Cuotas, c => Assert.Equal(EstadoCuota.Pendiente, c.Estado));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task Cancelar_SinMotivo_LanzaReglaDeDominio(string motivo)
    {
        await using var context = _fixture.CreateContext();

        await Assert.ThrowsAsync<ReglaDeDominioException>(() => PolizasDePrueba.CrearServicio(context)
            .CancelarAsync(SeedData.PolizaId, new CancelarPolizaRequest { Motivo = motivo }));
    }

    [Fact]
    public async Task Cancelar_PolizaInexistente_LanzaNotFound()
    {
        await using var context = _fixture.CreateContext();

        await Assert.ThrowsAsync<NotFoundException>(() => PolizasDePrueba.CrearServicio(context)
            .CancelarAsync(Guid.NewGuid(), new CancelarPolizaRequest { Motivo = "Pedido del cliente" }));
    }

    [Fact]
    public async Task Cancelar_RequestNulo_Lanza()
    {
        await using var context = _fixture.CreateContext();

        await Assert.ThrowsAsync<ArgumentNullException>(() =>
            PolizasDePrueba.CrearServicio(context).CancelarAsync(SeedData.PolizaId, null!));
    }
}
