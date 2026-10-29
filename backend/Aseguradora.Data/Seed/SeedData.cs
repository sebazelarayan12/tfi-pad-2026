using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Aseguradora.Data.Seed;

/// <summary>
/// Minimal test data with fixed ids so every team member starts from the same state:
/// one plan, one client with one vehicle, one active policy with six installments (the first one paid).
/// The remaining plans are seeded together with the plans module.
/// </summary>
public static class SeedData
{
    public static readonly Guid PlanRcId = Guid.Parse("a1000000-0000-0000-0000-000000000001");
    public static readonly Guid ClienteId = Guid.Parse("c1000000-0000-0000-0000-000000000001");
    public static readonly Guid VehiculoId = Guid.Parse("b1000000-0000-0000-0000-000000000001");
    public static readonly Guid PolizaId = Guid.Parse("d1000000-0000-0000-0000-000000000001");
    public static readonly Guid PagoId = Guid.Parse("e1000000-0000-0000-0000-000000000001");

    private const int Vigencia = 6;
    private const decimal Prima = 12000.00m;

    private static readonly DateTime Emision = new(2026, 10, 15, 0, 0, 0, DateTimeKind.Utc);

    public static void Apply(ModelBuilder modelBuilder)
    {
        IdentityRolesSeed.Apply(modelBuilder);

        modelBuilder.Entity<Plan>().HasData(new Plan
        {
            Id = PlanRcId,
            Codigo = "RC",
            Nombre = "Responsabilidad Civil",
            Descripcion = "Cubre los daños que se le causan a terceros.",
            PrimaBase = Prima,
            TiposPermitidos = "Auto,Moto,Camioneta",
            AntiguedadMaxima = null,
            Activo = true
        });

        modelBuilder.Entity<Cliente>().HasData(new Cliente
        {
            Id = ClienteId,
            Dni = "30123456",
            Cuil = "20301234565",
            Nombre = "Juan Carlos",
            Apellido = "Pérez",
            FechaNacimiento = new DateOnly(1985, 3, 21),
            Sexo = 'M',
            Email = "juan.perez@example.com",
            Calle = "San Martín",
            Numero = "1234",
            Localidad = "San Miguel de Tucumán",
            Provincia = "Tucumán",
            CodigoPostal = "4000",
            ValidadoRenaper = true,
            FechaValidacionRenaper = Emision,
            Activo = true
        });

        modelBuilder.Entity<Vehiculo>().HasData(new Vehiculo
        {
            Id = VehiculoId,
            ClienteId = ClienteId,
            Patente = "AB123CD",
            Marca = "Toyota",
            Modelo = "Corolla XEi",
            Anio = 2021,
            Tipo = TipoVehiculo.Auto,
            Uso = UsoVehiculo.Particular,
            NumeroMotor = "2ZR1234567",
            NumeroChasis = "9BRBL3HE5M0123456",
            ValidadoDnrpa = true,
            Activo = true
        });

        modelBuilder.Entity<Poliza>().HasData(new Poliza
        {
            Id = PolizaId,
            Numero = "POL-0000001",
            ClienteId = ClienteId,
            VehiculoId = VehiculoId,
            PlanId = PlanRcId,
            PrimaMensual = Prima,
            VigenciaMeses = Vigencia,
            FechaEmision = Emision,
            FechaInicio = new DateOnly(2026, 10, 15),
            FechaFin = new DateOnly(2027, 4, 15),
            Estado = EstadoPoliza.Vigente
        });

        modelBuilder.Entity<Cuota>().HasData(Enumerable.Range(1, Vigencia).Select(CrearCuota));

        modelBuilder.Entity<Pago>().HasData(new Pago
        {
            Id = PagoId,
            ClienteId = ClienteId,
            ImporteTotal = Prima,
            Numero = "PAG-000001",
            Medio = MedioPago.Caja,
            Estado = EstadoPago.Aprobado,
            FechaCreacion = Emision,
            FechaAcreditacion = Emision
        });

        modelBuilder.Entity<PagoCuota>().HasData(new PagoCuota
        {
            PagoId = PagoId,
            CuotaId = CuotaId(1),
            Importe = Prima
        });
    }

    /// <summary>
    /// Runs every registered <see cref="ISeeder"/> inside one scope. Called after migrating, at startup
    /// (Migraciones:AplicarAlIniciar) and by the --migrar command.
    /// </summary>
    public static async Task EjecutarAsync(IServiceProvider services, CancellationToken ct = default)
    {
        await using var scope = services.CreateAsyncScope();
        foreach (var seeder in scope.ServiceProvider.GetServices<ISeeder>())
            await seeder.SembrarAsync(scope.ServiceProvider, ct);
    }

    public static Guid CuotaId(int numero) => Guid.Parse($"f1000000-0000-0000-0000-{numero:D12}");

    private static Cuota CrearCuota(int numero) => new()
    {
        Id = CuotaId(numero),
        PolizaId = PolizaId,
        Numero = numero,
        Importe = Prima,
        Recargo = 0m,
        // Installments fall due on the 10th of each month, starting the month after issue.
        FechaVencimiento = new DateOnly(2026, 10, 10).AddMonths(numero),
        Estado = numero == 1 ? EstadoCuota.Pagada : EstadoCuota.Pendiente,
        FechaPago = numero == 1 ? Emision : null
    };
}
