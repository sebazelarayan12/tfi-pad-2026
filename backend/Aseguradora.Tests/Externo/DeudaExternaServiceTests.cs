using Aseguradora.Application.Dtos;
using Aseguradora.Application.Exceptions;
using Aseguradora.Application.Services;
using Aseguradora.Data;
using Aseguradora.Data.Repositories;
using Aseguradora.Data.Seed;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Tests.Data;

namespace Aseguradora.Tests.Externo;

/// <summary>
/// Uses the seed: client 30123456 (Juan Carlos Pérez) owns POL-0000001 on AB123CD with six installments,
/// where installment 1 is Pagada. Each test sets the installment states it needs.
/// </summary>
public sealed class DeudaExternaServiceTests : IDisposable
{
    private const string Dni = "30123456";
    private const string NombreCliente = "Juan Carlos Pérez";

    private readonly SqliteDbFixture _fixture = new();

    public void Dispose() => _fixture.Dispose();

    [Fact]
    public async Task ClienteConCuotasPendientesYVencidas_SumaSoloLasImpagasAgrupadasPorPoliza()
    {
        await ConfigurarCuotasAsync(
            (2, EstadoCuota.Vencida, 50m),
            (3, EstadoCuota.Anulada, 0m),
            (4, EstadoCuota.Pendiente, 0m),
            (5, EstadoCuota.Pendiente, 0m),
            (6, EstadoCuota.Pendiente, 0m));

        var respuesta = await ObtenerAsync();

        Assert.Equal(Dni, respuesta.Dni);
        Assert.Equal(NombreCliente, respuesta.Cliente);
        Assert.Equal(4050.00m, respuesta.TotalAdeudado);
        var poliza = Assert.Single(respuesta.Polizas);
        Assert.Equal("POL-0000001", poliza.NumeroPoliza);
        Assert.Equal("AB123CD", poliza.Patente);
        Assert.Equal([2, 4, 5, 6], poliza.Cuotas.Select(c => c.Numero).ToArray());
        Assert.Equal(["VENCIDA", "PENDIENTE", "PENDIENTE", "PENDIENTE"], poliza.Cuotas.Select(c => c.Estado).ToArray());
    }

    [Fact]
    public async Task RecargoSeSumaAlTotalDeLaCuota()
    {
        await ConfigurarCuotasAsync(
            (2, EstadoCuota.Vencida, 50m),
            (3, EstadoCuota.Pagada, 0m),
            (4, EstadoCuota.Pagada, 0m),
            (5, EstadoCuota.Pagada, 0m),
            (6, EstadoCuota.Pagada, 0m));

        var cuota = Assert.Single(Assert.Single((await ObtenerAsync()).Polizas).Cuotas);

        Assert.Equal(SeedData.CuotaId(2), cuota.IdCuota);
        Assert.Equal(2, cuota.Numero);
        Assert.Equal(1000.00m, cuota.Importe);
        Assert.Equal(50.00m, cuota.Recargo);
        Assert.Equal(1050.00m, cuota.Total);
        Assert.Equal(new DateOnly(2026, 12, 10), cuota.Vencimiento);
        Assert.Equal("VENCIDA", cuota.Estado);
        Assert.Equal(1050.00m, (await ObtenerAsync()).TotalAdeudado);
    }

    [Fact]
    public async Task ClienteSinDeuda_DevuelveTotalCeroYSinPolizas()
    {
        await ConfigurarCuotasAsync(
            (2, EstadoCuota.Pagada, 0m),
            (3, EstadoCuota.Anulada, 0m),
            (4, EstadoCuota.Pagada, 0m),
            (5, EstadoCuota.Pagada, 0m),
            (6, EstadoCuota.Pagada, 0m));

        var respuesta = await ObtenerAsync();

        Assert.Equal(Dni, respuesta.Dni);
        Assert.Equal(NombreCliente, respuesta.Cliente);
        Assert.Equal(0m, respuesta.TotalAdeudado);
        Assert.Empty(respuesta.Polizas);
    }

    [Fact]
    public async Task ClienteInexistente_LanzaNotFoundConCodigoClienteNoEncontrado()
    {
        await using var context = _fixture.CreateContext();

        var excepcion = await Assert.ThrowsAsync<NotFoundException>(
            () => CrearServicio(context).ObtenerDeudaAsync("99999999"));

        Assert.Equal("CLIENTE_NO_ENCONTRADO", excepcion.Codigo);
    }

    [Fact]
    public async Task PolizaCancelada_NoAparece()
    {
        await ModificarAsync(context =>
        {
            context.Polizas.Single(p => p.Id == SeedData.PolizaId).Estado = EstadoPoliza.Cancelada;
            foreach (var numero in Enumerable.Range(2, 5))
                context.Cuotas.Single(c => c.Id == SeedData.CuotaId(numero)).Estado = EstadoCuota.Anulada;
        });

        var respuesta = await ObtenerAsync();

        Assert.Equal(0m, respuesta.TotalAdeudado);
        Assert.Empty(respuesta.Polizas);
    }

    [Fact]
    public async Task CuotasAnuladas_NoSeIncluyenEnLaDeuda()
    {
        await ConfigurarCuotasAsync(
            (2, EstadoCuota.Anulada, 0m),
            (3, EstadoCuota.Anulada, 0m),
            (4, EstadoCuota.Pendiente, 0m),
            (5, EstadoCuota.Pagada, 0m),
            (6, EstadoCuota.Pagada, 0m));

        var respuesta = await ObtenerAsync();

        Assert.Equal(1000.00m, respuesta.TotalAdeudado);
        Assert.Equal([4], Assert.Single(respuesta.Polizas).Cuotas.Select(c => c.Numero).ToArray());
    }

    [Fact]
    public async Task ClienteConDosPolizas_AgrupaCadaUnaConSuPatente()
    {
        await ConfigurarCuotasAsync(
            (2, EstadoCuota.Pendiente, 0m),
            (3, EstadoCuota.Pagada, 0m),
            (4, EstadoCuota.Pagada, 0m),
            (5, EstadoCuota.Pagada, 0m),
            (6, EstadoCuota.Pagada, 0m));
        await AgregarPolizaConUnaCuotaAsync(numeroPoliza: "POL-0000002", patente: "AA111AA", importe: 500m);

        var respuesta = await ObtenerAsync();

        Assert.Equal(1500.00m, respuesta.TotalAdeudado);
        Assert.Equal(["POL-0000001", "POL-0000002"], respuesta.Polizas.Select(p => p.NumeroPoliza).ToArray());
        Assert.Equal(["AB123CD", "AA111AA"], respuesta.Polizas.Select(p => p.Patente).ToArray());
        Assert.Equal(1000.00m, respuesta.Polizas[0].Cuotas.Single().Importe);
        Assert.Equal(500.00m, respuesta.Polizas[1].Cuotas.Single().Importe);
    }

    private async Task<DeudaExternaResponse> ObtenerAsync()
    {
        await using var context = _fixture.CreateContext();
        return await CrearServicio(context).ObtenerDeudaAsync(Dni);
    }

    // Sets importes of the seeded installments so the sums are exact, then the given states and surcharges.
    private async Task ConfigurarCuotasAsync(params (int Numero, EstadoCuota Estado, decimal Recargo)[] cuotas)
    {
        await ModificarAsync(context =>
        {
            foreach (var (numero, estado, recargo) in cuotas)
            {
                var cuota = context.Cuotas.Single(c => c.Id == SeedData.CuotaId(numero));
                cuota.Importe = 1000m;
                cuota.Estado = estado;
                cuota.Recargo = recargo;
            }
        });
    }

    private async Task AgregarPolizaConUnaCuotaAsync(string numeroPoliza, string patente, decimal importe)
    {
        await ModificarAsync(context =>
        {
            var vehiculo = new Vehiculo
            {
                Id = Guid.NewGuid(),
                ClienteId = SeedData.ClienteId,
                Patente = patente,
                Marca = "Ford",
                Modelo = "Fiesta",
                Anio = 2020,
                Tipo = TipoVehiculo.Auto,
                Uso = UsoVehiculo.Particular,
                NumeroMotor = "MOTOR-2",
                NumeroChasis = "CHASIS-2"
            };
            var poliza = new Poliza
            {
                Id = Guid.NewGuid(),
                Numero = numeroPoliza,
                ClienteId = SeedData.ClienteId,
                VehiculoId = vehiculo.Id,
                PlanId = SeedData.PlanRcId,
                PrimaMensual = importe,
                VigenciaMeses = 1,
                FechaEmision = new DateTime(2026, 10, 15, 0, 0, 0, DateTimeKind.Utc),
                FechaInicio = new DateOnly(2026, 10, 15),
                FechaFin = new DateOnly(2027, 4, 15),
                Estado = EstadoPoliza.Vigente
            };
            context.Vehiculos.Add(vehiculo);
            context.Polizas.Add(poliza);
            context.Cuotas.Add(new Cuota
            {
                Id = Guid.NewGuid(),
                PolizaId = poliza.Id,
                Numero = 1,
                Importe = importe,
                Recargo = 0m,
                FechaVencimiento = new DateOnly(2026, 11, 10),
                Estado = EstadoCuota.Pendiente
            });
        });
    }

    private async Task ModificarAsync(Action<AseguradoraDbContext> cambios)
    {
        await using var context = _fixture.CreateContext();
        cambios(context);
        await context.SaveChangesAsync();
    }

    private static DeudaExternaService CrearServicio(AseguradoraDbContext context) =>
        new(
            new EfRepository<Cliente>(context),
            new EfRepository<Poliza>(context),
            new EfRepository<Cuota>(context),
            new EfRepository<Vehiculo>(context));
}
