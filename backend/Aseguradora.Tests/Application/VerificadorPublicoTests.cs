using Aseguradora.Application.Exceptions;
using Aseguradora.Application.Publico;
using Aseguradora.Data;
using Aseguradora.Data.Repositories;
using Aseguradora.Data.Seed;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Tests.Data;
using Aseguradora.Tests.Support;

namespace Aseguradora.Tests.Application;

public sealed class VerificadorPublicoTests : IDisposable
{
    private readonly SqliteDbFixture _sqlite = new();

    public void Dispose() => _sqlite.Dispose();

    private static VerificadorPublico CrearServicio(AseguradoraDbContext context) => new(
        new EfRepository<Cliente>(context),
        new EfRepository<Poliza>(context),
        new EfRepository<Pago>(context));

    private static async Task<Poliza> AgregarOtroTitularAsync(AseguradoraDbContext context) =>
        await PolizasDePrueba.AgregarPolizaAsync(
            context, EstadoPoliza.Vigente, new DateTime(2026, 10, 15, 0, 0, 0, DateTimeKind.Utc));

    private static async Task AgregarPagoAsync(AseguradoraDbContext context, Guid clienteId, string numero)
    {
        var fecha = new DateTime(2026, 10, 15, 0, 0, 0, DateTimeKind.Utc);
        context.Pagos.Add(new Pago
        {
            Id = Guid.NewGuid(),
            ClienteId = clienteId,
            Numero = numero,
            ImporteTotal = 12000m,
            Medio = MedioPago.Caja,
            Estado = EstadoPago.Aprobado,
            FechaCreacion = fecha,
            FechaAcreditacion = fecha
        });
        await context.SaveChangesAsync();
    }

    [Fact]
    public async Task VerificarPoliza_DatosCorrectos_DevuelveLaPoliza()
    {
        await using var context = _sqlite.CreateContext();

        var poliza = await CrearServicio(context).VerificarPolizaAsync("30123456", "POL-0000001");

        Assert.Equal(SeedData.PolizaId, poliza.Id);
    }

    [Fact]
    public async Task VerificarPoliza_DniDeOtroTitular_LanzaNotFound()
    {
        await using var context = _sqlite.CreateContext();
        var ajena = await AgregarOtroTitularAsync(context);

        var ex = await Assert.ThrowsAsync<NotFoundException>(() =>
            CrearServicio(context).VerificarPolizaAsync(ajena.Cliente.Dni, "POL-0000001"));

        Assert.Equal(VerificadorPublico.MensajeNoEncontrado, ex.Message);
    }

    [Fact]
    public async Task VerificarPoliza_NumeroInexistente_LanzaElMismoErrorQueElDniAjeno()
    {
        await using var context = _sqlite.CreateContext();
        var ajena = await AgregarOtroTitularAsync(context);
        var servicio = CrearServicio(context);

        var dniAjeno = await Assert.ThrowsAsync<NotFoundException>(() =>
            servicio.VerificarPolizaAsync("30123456", ajena.Numero));
        var inexistente = await Assert.ThrowsAsync<NotFoundException>(() =>
            servicio.VerificarPolizaAsync("30123456", "POL-9999999"));

        Assert.IsType<NotFoundException>(dniAjeno);
        Assert.IsType<NotFoundException>(inexistente);
        Assert.Equal(VerificadorPublico.MensajeNoEncontrado, dniAjeno.Message);
        Assert.Equal(dniAjeno.Message, inexistente.Message);
    }

    [Fact]
    public async Task VerificarPago_DatosCorrectos_DevuelveElPago()
    {
        await using var context = _sqlite.CreateContext();

        var pago = await CrearServicio(context).VerificarPagoAsync("30123456", "PAG-000001");

        Assert.Equal(SeedData.PagoId, pago.Id);
    }

    [Fact]
    public async Task VerificarPago_DniDeOtroTitular_LanzaNotFound()
    {
        await using var context = _sqlite.CreateContext();
        var ajena = await AgregarOtroTitularAsync(context);

        var ex = await Assert.ThrowsAsync<NotFoundException>(() =>
            CrearServicio(context).VerificarPagoAsync(ajena.Cliente.Dni, "PAG-000001"));

        Assert.Equal(VerificadorPublico.MensajeNoEncontrado, ex.Message);
    }

    [Fact]
    public async Task VerificarPago_PagoDeOtroCliente_LanzaElMismoError()
    {
        await using var context = _sqlite.CreateContext();
        var ajena = await AgregarOtroTitularAsync(context);
        await AgregarPagoAsync(context, ajena.ClienteId, "PAG-000002");

        var ex = await Assert.ThrowsAsync<NotFoundException>(() =>
            CrearServicio(context).VerificarPagoAsync("30123456", "PAG-000002"));

        Assert.Equal(VerificadorPublico.MensajeNoEncontrado, ex.Message);
    }

    [Fact]
    public async Task VerificarPago_NumeroInexistente_LanzaElMismoError()
    {
        await using var context = _sqlite.CreateContext();

        var ex = await Assert.ThrowsAsync<NotFoundException>(() =>
            CrearServicio(context).VerificarPagoAsync("30123456", "PAG-999999"));

        Assert.Equal(VerificadorPublico.MensajeNoEncontrado, ex.Message);
    }
}
