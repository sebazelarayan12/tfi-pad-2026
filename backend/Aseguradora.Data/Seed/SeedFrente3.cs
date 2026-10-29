using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;

namespace Aseguradora.Data.Seed;

/// <summary>
/// Development-only test data for issuing policies (US-F3-02) until Frente 2 publishes its quote
/// endpoints: a client and a vehicle, both validated, and a valid quote for them on the RC plan.
/// The seeded vehicle of <see cref="SeedData"/> already has a Vigente policy (RN04), so this one
/// has its own. Idempotent: it only inserts what is missing.
/// </summary>
public sealed class SeedFrente3(AseguradoraDbContext context, IHostEnvironment entorno) : ISeeder
{
    /// <summary>Fixed identifier of the test client.</summary>
    public static readonly Guid ClientePruebaId = Guid.Parse("c3000000-0000-0000-0000-000000000001");

    /// <summary>Fixed identifier of the test vehicle.</summary>
    public static readonly Guid VehiculoPruebaId = Guid.Parse("b3000000-0000-0000-0000-000000000001");

    /// <summary>Fixed identifier of the test quote, the one to send to the issue endpoint.</summary>
    public static readonly Guid CotizacionPruebaId = Guid.Parse("d3000000-0000-0000-0000-000000000001");

    /// <summary>Monthly premium of the test quote.</summary>
    public const decimal PrimaMensualPrueba = 12000.00m;

    private const string PatentePrueba = "AC456EF";
    private const int AnioVehiculoPrueba = 2022;
    private const int EdadConductorPrueba = 35;

    private static readonly DateTime FechaCotizacion = new(2026, 10, 29, 0, 0, 0, DateTimeKind.Utc);

    // Far ahead so the quote stays valid in every local database (RN06).
    private static readonly DateTime FechaVencimiento = new(2099, 12, 31, 23, 59, 59, DateTimeKind.Utc);

    /// <inheritdoc />
    public async Task SembrarAsync(IServiceProvider services, CancellationToken ct)
    {
        if (!entorno.IsDevelopment())
            return;

        await AgregarCotizacionDePrueba(context, ct);
    }

    /// <summary>
    /// Inserts the test client, vehicle and quote that are missing, and returns the quote.
    /// Public so tests can use it without a Development host.
    /// </summary>
    public static async Task<Cotizacion> AgregarCotizacionDePrueba(AseguradoraDbContext context, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(context);

        if (!await context.Clientes.AnyAsync(c => c.Id == ClientePruebaId, ct))
            context.Clientes.Add(CrearCliente());

        if (!await context.Vehiculos.AnyAsync(v => v.Id == VehiculoPruebaId, ct))
            context.Vehiculos.Add(CrearVehiculo());

        var cotizacion = await context.Cotizaciones.FirstOrDefaultAsync(c => c.Id == CotizacionPruebaId, ct);
        if (cotizacion is null)
        {
            cotizacion = CrearCotizacion();
            context.Cotizaciones.Add(cotizacion);
        }

        if (context.ChangeTracker.HasChanges())
            await context.SaveChangesAsync(ct);

        return cotizacion;
    }

    private static Cliente CrearCliente() => new()
    {
        Id = ClientePruebaId,
        Dni = "31000001",
        Cuil = "20310000015",
        Nombre = "María",
        Apellido = "Prueba Emisión",
        FechaNacimiento = new DateOnly(1991, 5, 10),
        Sexo = 'F',
        Email = "maria.prueba.f3@example.com",
        Calle = "Congreso",
        Numero = "500",
        Localidad = "San Miguel de Tucumán",
        Provincia = "Tucumán",
        CodigoPostal = "4000",
        ValidadoRenaper = true,
        FechaValidacionRenaper = FechaCotizacion,
        Activo = true
    };

    private static Vehiculo CrearVehiculo() => new()
    {
        Id = VehiculoPruebaId,
        ClienteId = ClientePruebaId,
        Patente = PatentePrueba,
        Marca = "Volkswagen",
        Modelo = "Gol Trend",
        Anio = AnioVehiculoPrueba,
        Tipo = TipoVehiculo.Auto,
        Uso = UsoVehiculo.Particular,
        NumeroMotor = "MOTF3000001",
        NumeroChasis = "CHAF3000001",
        ValidadoDnrpa = true,
        Activo = true
    };

    private static Cotizacion CrearCotizacion() => new()
    {
        Id = CotizacionPruebaId,
        PlanId = SeedData.PlanRcId,
        ClienteId = ClientePruebaId,
        VehiculoId = VehiculoPruebaId,
        TipoVehiculo = TipoVehiculo.Auto,
        AnioVehiculo = AnioVehiculoPrueba,
        Uso = UsoVehiculo.Particular,
        EdadConductor = EdadConductorPrueba,
        PrimaMensual = PrimaMensualPrueba,
        FechaCotizacion = FechaCotizacion,
        FechaVencimiento = FechaVencimiento,
        Origen = OrigenCotizacion.Panel
    };
}
