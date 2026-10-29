using Aseguradora.Application.Dtos.Polizas;
using Aseguradora.Application.Exceptions;
using Aseguradora.Application.Services;
using Aseguradora.Data;
using Aseguradora.Data.Repositories;
using Aseguradora.Data.Seed;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Domain.Exceptions;
using Aseguradora.Domain.Interfaces;
using Aseguradora.Tests.Builders;
using Aseguradora.Tests.Data;
using Aseguradora.Tests.Fakes;
using Aseguradora.Tests.Support;
using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;

namespace Aseguradora.Tests.Application;

public sealed class PolizaServiceEmisionTests : IDisposable
{
    // 12:00 in Argentina (UTC-3) on 29/10/2026.
    private static readonly DateTimeOffset Ahora = new(2026, 10, 29, 15, 0, 0, TimeSpan.Zero);
    private static readonly DateOnly Hoy = new(2026, 10, 29);

    private readonly SqliteDbFixture _fixture = new();
    private readonly NumeradorPolizasFalso _numerador = new();

    public PolizaServiceEmisionTests()
    {
        // SeedData already uses POL-0000001 (the real sequence starts at 2 for that reason). Renaming
        // the seeded policy lets these tests check numbering from the first number, as CU10 asks.
        using var context = _fixture.CreateContext();
        context.Database.ExecuteSql($"UPDATE Polizas SET Numero = 'POL-SEMILLA' WHERE Id = {SeedData.PolizaId}");
    }

    public void Dispose() => _fixture.Dispose();

    [Theory]
    [InlineData(1)]
    [InlineData(6)]
    [InlineData(12)]
    public async Task Emitir_CotizacionValida_CreaPolizaPendienteConCuotas(int vigenciaMeses)
    {
        await using var context = _fixture.CreateContext();
        var escenario = await CrearEscenarioAsync(context);
        var service = CrearServicio(context);

        var poliza = await service.EmitirAsync(
            new EmitirPolizaRequest(escenario.Cotizacion.Id, vigenciaMeses), CancellationToken.None);

        Assert.Equal("POL-0000001", poliza.Numero);
        Assert.Equal(EstadoPoliza.Pendiente, poliza.Estado);
        Assert.Equal(escenario.Cliente.Id, poliza.ClienteId);
        Assert.Equal(escenario.Vehiculo.Patente, poliza.Patente);
        Assert.Equal(escenario.Plan.Codigo, poliza.CodigoPlan);
        Assert.Equal(escenario.Cotizacion.Id, poliza.CotizacionId);
        Assert.Equal(escenario.Cotizacion.PrimaMensual, poliza.PrimaMensual);
        Assert.Equal(Hoy, poliza.FechaInicio);
        Assert.Equal(Hoy.AddMonths(vigenciaMeses), poliza.FechaFin);
        Assert.Equal(Ahora.UtcDateTime, poliza.FechaEmision);

        // RN07: one installment per month, each for the premium of the quote.
        Assert.Equal(vigenciaMeses, poliza.Cuotas.Count);
        Assert.Equal(Enumerable.Range(1, vigenciaMeses), poliza.Cuotas.Select(c => c.Numero));
        Assert.All(poliza.Cuotas, c =>
        {
            Assert.Equal(escenario.Cotizacion.PrimaMensual, c.Importe);
            Assert.Equal(EstadoCuota.Pendiente, c.Estado);
        });

        await using var verificacion = _fixture.CreateContext();
        var guardada = await verificacion.Polizas.Include(p => p.Cuotas).SingleAsync(p => p.Id == poliza.Id);
        Assert.Equal(EstadoPoliza.Pendiente, guardada.Estado);
        Assert.Equal(vigenciaMeses, guardada.Cuotas.Count);
    }

    [Fact]
    public async Task Emitir_CotizacionInexistente_LanzaNotFound()
    {
        await using var context = _fixture.CreateContext();
        var service = CrearServicio(context);

        await Assert.ThrowsAsync<NotFoundException>(
            () => service.EmitirAsync(new EmitirPolizaRequest(Guid.NewGuid(), 6), CancellationToken.None));
    }

    [Fact]
    public async Task Emitir_CotizacionVencida_Lanza()
    {
        await using var context = _fixture.CreateContext();
        var escenario = await CrearEscenarioAsync(
            context, ajustarCotizacion: c => c.FechaVencimiento = Ahora.UtcDateTime.AddSeconds(-1));

        var ex = await EmitirYEsperarErrorAsync(context, escenario.Cotizacion.Id);

        Assert.Contains("RN06", ex.Message);
    }

    [Fact]
    public async Task Emitir_CotizacionQueVenceHoyMasTarde_Permite()
    {
        await using var context = _fixture.CreateContext();
        var escenario = await CrearEscenarioAsync(
            context, ajustarCotizacion: c => c.FechaVencimiento = Ahora.UtcDateTime.AddHours(1));

        var poliza = await CrearServicio(context).EmitirAsync(
            new EmitirPolizaRequest(escenario.Cotizacion.Id, 6), CancellationToken.None);

        Assert.Equal(EstadoPoliza.Pendiente, poliza.Estado);
    }

    [Fact]
    public async Task Emitir_CotizacionYaUsada_Lanza()
    {
        await using var context = _fixture.CreateContext();
        var escenario = await CrearEscenarioAsync(context);
        var service = CrearServicio(context);
        await service.EmitirAsync(new EmitirPolizaRequest(escenario.Cotizacion.Id, 6), CancellationToken.None);

        var ex = await Assert.ThrowsAsync<BusinessRuleException>(
            () => service.EmitirAsync(new EmitirPolizaRequest(escenario.Cotizacion.Id, 12), CancellationToken.None));

        Assert.Contains("ya se usó", ex.Message);
    }

    [Fact]
    public async Task Emitir_CotizacionExternaSinClienteNiVehiculo_Lanza()
    {
        await using var context = _fixture.CreateContext();
        var escenario = await CrearEscenarioAsync(context, ajustarCotizacion: c =>
        {
            c.ClienteId = null;
            c.VehiculoId = null;
            c.Origen = OrigenCotizacion.Externo;
        });

        var ex = await EmitirYEsperarErrorAsync(context, escenario.Cotizacion.Id);

        Assert.Contains("cotización externa", ex.Message);
    }

    [Fact]
    public async Task Emitir_ClienteNoValidadoRenaper_Lanza()
    {
        await using var context = _fixture.CreateContext();
        var escenario = await CrearEscenarioAsync(context, ajustarCliente: c => c.ValidadoRenaper = false);

        var ex = await EmitirYEsperarErrorAsync(context, escenario.Cotizacion.Id);

        Assert.Contains("RN02", ex.Message);
    }

    [Fact]
    public async Task Emitir_ClienteInactivo_Lanza()
    {
        await using var context = _fixture.CreateContext();
        var escenario = await CrearEscenarioAsync(context, ajustarCliente: c => c.Activo = false);

        var ex = await EmitirYEsperarErrorAsync(context, escenario.Cotizacion.Id);

        Assert.Contains("no está activo", ex.Message);
    }

    [Fact]
    public async Task Emitir_VehiculoNoValidadoDnrpa_Lanza()
    {
        await using var context = _fixture.CreateContext();
        var escenario = await CrearEscenarioAsync(context, ajustarVehiculo: v => v.ValidadoDnrpa = false);

        var ex = await EmitirYEsperarErrorAsync(context, escenario.Cotizacion.Id);

        Assert.Contains("DNRPA", ex.Message);
    }

    [Fact]
    public async Task Emitir_TitularDistinto_Lanza()
    {
        await using var context = _fixture.CreateContext();
        var otroCliente = new ClienteBuilder().Construir();
        context.Clientes.Add(otroCliente);
        var escenario = await CrearEscenarioAsync(context, ajustarVehiculo: v =>
        {
            v.ClienteId = otroCliente.Id;
            v.Cliente = otroCliente;
        });

        var ex = await EmitirYEsperarErrorAsync(context, escenario.Cotizacion.Id);

        Assert.Contains("no pertenece al cliente", ex.Message);
    }

    [Theory]
    [InlineData(EstadoPoliza.Pendiente)]
    [InlineData(EstadoPoliza.Vigente)]
    [InlineData(EstadoPoliza.Suspendida)]
    public async Task Emitir_VehiculoConPolizaActiva_Lanza(EstadoPoliza estadoExistente)
    {
        await using var context = _fixture.CreateContext();
        var escenario = await CrearEscenarioAsync(context);
        await AgregarPolizaExistenteAsync(context, escenario, estadoExistente);

        var ex = await EmitirYEsperarErrorAsync(context, escenario.Cotizacion.Id);

        Assert.Contains("RN04", ex.Message);
    }

    [Theory]
    [InlineData(EstadoPoliza.Cancelada)]
    [InlineData(EstadoPoliza.Vencida)]
    public async Task Emitir_VehiculoConPolizaCancelada_Permite(EstadoPoliza estadoExistente)
    {
        await using var context = _fixture.CreateContext();
        var escenario = await CrearEscenarioAsync(context);
        await AgregarPolizaExistenteAsync(context, escenario, estadoExistente);

        var poliza = await CrearServicio(context).EmitirAsync(
            new EmitirPolizaRequest(escenario.Cotizacion.Id, 6), CancellationToken.None);

        Assert.Equal(EstadoPoliza.Pendiente, poliza.Estado);
    }

    [Fact]
    public async Task Emitir_PlanNoAceptaTipo_Lanza()
    {
        await using var context = _fixture.CreateContext();
        var escenario = await CrearEscenarioAsync(context, ajustarPlan: p => p.TiposPermitidos = "Moto");

        var ex = await EmitirYEsperarErrorAsync(context, escenario.Cotizacion.Id);

        Assert.Contains("RN05", ex.Message);
    }

    [Fact]
    public async Task Emitir_AntiguedadExcedida_Lanza()
    {
        await using var context = _fixture.CreateContext();
        var escenario = await CrearEscenarioAsync(
            context,
            ajustarVehiculo: v => v.Anio = 2015,
            ajustarPlan: p => p.AntiguedadMaxima = 10);

        var ex = await EmitirYEsperarErrorAsync(context, escenario.Cotizacion.Id);

        Assert.Contains("RN05", ex.Message);
    }

    [Fact]
    public async Task Emitir_AntiguedadEnElLimite_Permite()
    {
        await using var context = _fixture.CreateContext();
        var escenario = await CrearEscenarioAsync(
            context,
            ajustarVehiculo: v => v.Anio = 2016,
            ajustarPlan: p => p.AntiguedadMaxima = 10);

        var poliza = await CrearServicio(context).EmitirAsync(
            new EmitirPolizaRequest(escenario.Cotizacion.Id, 6), CancellationToken.None);

        Assert.Equal(EstadoPoliza.Pendiente, poliza.Estado);
    }

    [Fact]
    public async Task Emitir_PlanInactivo_Lanza()
    {
        await using var context = _fixture.CreateContext();
        var escenario = await CrearEscenarioAsync(context, ajustarPlan: p => p.Activo = false);

        var ex = await EmitirYEsperarErrorAsync(context, escenario.Cotizacion.Id);

        Assert.Contains("no está activo", ex.Message);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(3)]
    [InlineData(24)]
    public async Task Emitir_VigenciaInvalida_LanzaReglaDeDominio(int vigenciaMeses)
    {
        await using var context = _fixture.CreateContext();
        var escenario = await CrearEscenarioAsync(context);

        await Assert.ThrowsAsync<ReglaDeDominioException>(() => CrearServicio(context).EmitirAsync(
            new EmitirPolizaRequest(escenario.Cotizacion.Id, vigenciaMeses), CancellationToken.None));
    }

    [Fact]
    public async Task Emitir_FallaValidacion_NoGuardaNada()
    {
        await using var context = _fixture.CreateContext();
        var escenario = await CrearEscenarioAsync(context);
        var polizasAntes = await context.Polizas.CountAsync();
        var cuotasAntes = await context.Cuotas.CountAsync();

        await Assert.ThrowsAsync<ReglaDeDominioException>(() => CrearServicio(context).EmitirAsync(
            new EmitirPolizaRequest(escenario.Cotizacion.Id, 3), CancellationToken.None));

        await using var verificacion = _fixture.CreateContext();
        Assert.Equal(polizasAntes, await verificacion.Polizas.CountAsync());
        Assert.Equal(cuotasAntes, await verificacion.Cuotas.CountAsync());
        // The term is checked before a policy number is taken.
        Assert.Equal(0, _numerador.Entregados);
    }

    [Fact]
    public async Task Emitir_NumerosConsecutivos()
    {
        await using var context = _fixture.CreateContext();
        var primera = await CrearEscenarioAsync(context);
        var segunda = await CrearEscenarioAsync(context);
        var service = CrearServicio(context);

        var polizaUno = await service.EmitirAsync(new EmitirPolizaRequest(primera.Cotizacion.Id, 6), CancellationToken.None);
        var polizaDos = await service.EmitirAsync(new EmitirPolizaRequest(segunda.Cotizacion.Id, 6), CancellationToken.None);

        Assert.Equal("POL-0000001", polizaUno.Numero);
        Assert.Equal("POL-0000002", polizaDos.Numero);
    }

    [Fact]
    public async Task Emitir_ArgumentoNulo_Lanza()
    {
        await using var context = _fixture.CreateContext();

        await Assert.ThrowsAsync<ArgumentNullException>(() => CrearServicio(context).EmitirAsync(null!, CancellationToken.None));
        Assert.Equal(0, _numerador.Entregados);
    }

    [Theory]
    [InlineData(EstadoPoliza.Pendiente)]
    [InlineData(EstadoPoliza.Vigente)]
    [InlineData(EstadoPoliza.Suspendida)]
    public async Task Emitir_CarreraMismoVehiculo_ElIndiceFrenaLaSegundaConBusinessRule(EstadoPoliza estadoExistente)
    {
        await using var context = _fixture.CreateContext();
        var escenario = await CrearEscenarioAsync(context);
        // The other issue was saved after this one checked RN04: the check sees no policy yet.
        await AgregarPolizaExistenteAsync(context, escenario, estadoExistente);

        var ex = await Assert.ThrowsAsync<BusinessRuleException>(() =>
            CrearServicio(context, verificaPolizas: false).EmitirAsync(
                new EmitirPolizaRequest(escenario.Cotizacion.Id, 6), CancellationToken.None));

        Assert.Contains("RN04", ex.Message);
        Assert.IsType<ViolacionUnicidadException>(ex.InnerException);
    }

    [Fact]
    public async Task Emitir_CarreraMismaCotizacion_ElIndiceFrenaLaSegundaConBusinessRule()
    {
        Escenario escenario;
        await using (var otraEmision = _fixture.CreateContext())
        {
            escenario = await CrearEscenarioAsync(otraEmision);
            // The other issue with the same quote was saved first, and its policy is already Cancelada,
            // so only the unique index on CotizacionId can stop this one.
            otraEmision.Polizas.Add(new PolizaBuilder()
                .Para(escenario.Cliente, escenario.Vehiculo, escenario.Plan)
                .Con(p => { p.Estado = EstadoPoliza.Cancelada; p.CotizacionId = escenario.Cotizacion.Id; })
                .Construir());
            await otraEmision.SaveChangesAsync();
        }

        // A separate context, like a separate request: in the same one EF would detach the quote from
        // the first policy instead of reaching the database.
        await using var context = _fixture.CreateContext();

        var ex = await Assert.ThrowsAsync<BusinessRuleException>(() =>
            CrearServicio(context, verificaPolizas: false).EmitirAsync(
                new EmitirPolizaRequest(escenario.Cotizacion.Id, 6), CancellationToken.None));

        Assert.IsType<ViolacionUnicidadException>(ex.InnerException);
    }

    private PolizaService CrearServicio(AseguradoraDbContext context, bool verificaPolizas = true) => new(
        new EfRepository<Cotizacion>(context),
        new EfRepository<Cliente>(context),
        new EfRepository<Vehiculo>(context),
        new EfRepository<Plan>(context),
        verificaPolizas ? new EfRepository<Poliza>(context) : new PolizasQueNoVenOtrasEmisiones(context),
        new EfRepository<Cuota>(context),
        _numerador,
        new UnitOfWork(context),
        new RelojFalso(Ahora));

    /// <summary>Simulates a concurrent issue: the existence checks run before the other one was saved.</summary>
    private sealed class PolizasQueNoVenOtrasEmisiones(AseguradoraDbContext context) : IRepository<Poliza>
    {
        private readonly EfRepository<Poliza> _real = new(context);

        public Task<bool> AnyAsync(Expression<Func<Poliza, bool>> predicate, CancellationToken cancellationToken = default) =>
            Task.FromResult(false);

        public Task<Poliza?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
            _real.GetByIdAsync(id, cancellationToken);
        public Task<IReadOnlyList<Poliza>> GetAllAsync(CancellationToken cancellationToken = default) =>
            _real.GetAllAsync(cancellationToken);
        public Task<IReadOnlyList<Poliza>> FindAsync(Expression<Func<Poliza, bool>> predicate, CancellationToken cancellationToken = default) =>
            _real.FindAsync(predicate, cancellationToken);
        public Task AddAsync(Poliza entity, CancellationToken cancellationToken = default) =>
            _real.AddAsync(entity, cancellationToken);
        public void Update(Poliza entity) => _real.Update(entity);
        public void Remove(Poliza entity) => _real.Remove(entity);
        public IQueryable<Poliza> Query() => _real.Query();
    }

    private async Task<BusinessRuleException> EmitirYEsperarErrorAsync(AseguradoraDbContext context, Guid cotizacionId)
    {
        var ex = await Assert.ThrowsAsync<BusinessRuleException>(() => CrearServicio(context).EmitirAsync(
            new EmitirPolizaRequest(cotizacionId, 6), CancellationToken.None));
        Assert.Equal(0, _numerador.Entregados);
        return ex;
    }

    private static async Task<Escenario> CrearEscenarioAsync(
        AseguradoraDbContext context,
        Action<Cliente>? ajustarCliente = null,
        Action<Vehiculo>? ajustarVehiculo = null,
        Action<Plan>? ajustarPlan = null,
        Action<Cotizacion>? ajustarCotizacion = null)
    {
        var cliente = new ClienteBuilder().Con(ajustarCliente ?? (_ => { })).Construir();
        var vehiculo = new VehiculoBuilder().DeCliente(cliente).Con(ajustarVehiculo ?? (_ => { })).Construir();
        var plan = new PlanBuilder().Con(ajustarPlan ?? (_ => { })).Construir();
        var cotizacion = new CotizacionBuilder()
            .Para(cliente, vehiculo, plan)
            .Con(ajustarCotizacion ?? (_ => { }))
            .Construir();

        context.AddRange(cliente, vehiculo, plan, cotizacion);
        await context.SaveChangesAsync();
        return new Escenario(cliente, vehiculo, plan, cotizacion);
    }

    private static async Task AgregarPolizaExistenteAsync(
        AseguradoraDbContext context, Escenario escenario, EstadoPoliza estado)
    {
        var existente = new PolizaBuilder()
            .Para(escenario.Cliente, escenario.Vehiculo, escenario.Plan)
            .Con(p => p.Estado = estado)
            .Construir();
        context.Polizas.Add(existente);
        await context.SaveChangesAsync();
    }

    private sealed record Escenario(Cliente Cliente, Vehiculo Vehiculo, Plan Plan, Cotizacion Cotizacion);
}
