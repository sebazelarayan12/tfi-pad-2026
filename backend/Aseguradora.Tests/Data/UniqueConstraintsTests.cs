using Aseguradora.Data.Seed;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Aseguradora.Tests.Data;

public class UniqueConstraintsTests : IDisposable
{
    private readonly SqliteDbFixture _db = new();

    public void Dispose() => _db.Dispose();

    private static Cliente NuevoCliente(string dni = "11111111", string email = "otro@example.com") => new()
    {
        Dni = dni,
        Cuil = "20111111119",
        Nombre = "Ana",
        Apellido = "Gómez",
        Sexo = 'F',
        Email = email,
        Calle = "Calle",
        Numero = "1",
        Localidad = "Localidad",
        Provincia = "Provincia",
        CodigoPostal = "4000"
    };

    private static Pago NuevoPago(string numero, string? idExterno) => new()
    {
        ClienteId = SeedData.ClienteId,
        Numero = numero,
        IdExterno = idExterno,
        Medio = MedioPago.Pasarela,
        ImporteTotal = 100m,
        FechaCreacion = DateTime.UtcNow
    };

    [Fact]
    public void Seed_loads_one_client_with_vehicle_policy_and_six_installments()
    {
        using var context = _db.CreateContext();

        Assert.Equal(1, context.Clientes.Count());
        Assert.Equal(1, context.Vehiculos.Count());
        Assert.Equal(EstadoPoliza.Vigente, context.Polizas.Single().Estado);
        Assert.Equal(6, context.Cuotas.Count());
        Assert.Equal(1, context.Cuotas.Count(c => c.Estado == EstadoCuota.Pagada));
    }

    [Fact]
    public void Duplicate_dni_is_rejected()
    {
        using var context = _db.CreateContext();
        context.Clientes.Add(NuevoCliente(dni: "30123456"));

        Assert.Throws<DbUpdateException>(() => context.SaveChanges());
    }

    [Fact]
    public void Duplicate_email_is_rejected()
    {
        using var context = _db.CreateContext();
        context.Clientes.Add(NuevoCliente(email: "juan.perez@example.com"));

        Assert.Throws<DbUpdateException>(() => context.SaveChanges());
    }

    [Fact]
    public void Duplicate_patente_is_rejected()
    {
        using var context = _db.CreateContext();
        context.Vehiculos.Add(new Vehiculo
        {
            ClienteId = SeedData.ClienteId,
            Patente = "AB123CD",
            Marca = "Ford",
            Modelo = "Ka",
            Anio = 2019,
            NumeroMotor = "M1",
            NumeroChasis = "C1"
        });

        Assert.Throws<DbUpdateException>(() => context.SaveChanges());
    }

    [Fact]
    public void Duplicate_plan_codigo_is_rejected()
    {
        using var context = _db.CreateContext();
        context.Planes.Add(new Plan { Codigo = "RC", Nombre = "Otro", Descripcion = "x", TiposPermitidos = "Auto" });

        Assert.Throws<DbUpdateException>(() => context.SaveChanges());
    }

    [Fact]
    public void Duplicate_policy_number_is_rejected()
    {
        using var context = _db.CreateContext();
        context.Polizas.Add(new Poliza
        {
            Numero = "POL-0000001",
            ClienteId = SeedData.ClienteId,
            VehiculoId = SeedData.VehiculoId,
            PlanId = SeedData.PlanRcId,
            VigenciaMeses = 1
        });

        Assert.Throws<DbUpdateException>(() => context.SaveChanges());
    }

    [Fact]
    public void Installment_number_is_unique_within_a_policy()
    {
        using var context = _db.CreateContext();
        context.Cuotas.Add(new Cuota { PolizaId = SeedData.PolizaId, Numero = 1, Importe = 1m });

        Assert.Throws<DbUpdateException>(() => context.SaveChanges());
    }

    [Fact]
    public void Duplicate_external_payment_id_is_rejected_but_many_nulls_are_allowed()
    {
        using var context = _db.CreateContext();
        context.Pagos.AddRange(NuevoPago("PAG-000010", null), NuevoPago("PAG-000011", null), NuevoPago("PAG-000012", "PSR-1"));
        context.SaveChanges();

        context.Pagos.Add(NuevoPago("PAG-000013", "PSR-1"));

        Assert.Throws<DbUpdateException>(() => context.SaveChanges());
    }

    [Fact]
    public void Duplicate_settlement_file_name_is_rejected()
    {
        using var context = _db.CreateContext();
        context.RendicionesPagoFacil.Add(new RendicionPagoFacil { NombreArchivo = "rendicion-1.txt" });
        context.SaveChanges();

        context.RendicionesPagoFacil.Add(new RendicionPagoFacil { NombreArchivo = "rendicion-1.txt" });

        Assert.Throws<DbUpdateException>(() => context.SaveChanges());
    }

    [Fact]
    public void A_quote_can_issue_only_one_policy()
    {
        using var context = _db.CreateContext();
        var cotizacion = new Cotizacion
        {
            PlanId = SeedData.PlanRcId,
            TipoVehiculo = TipoVehiculo.Auto,
            Uso = UsoVehiculo.Particular,
            Origen = OrigenCotizacion.Panel
        };
        context.Cotizaciones.Add(cotizacion);
        context.Polizas.Add(NuevaPoliza("POL-0000010", cotizacion.Id));
        context.SaveChanges();

        // A separate context avoids EF relationship fix-up, which would null the first policy's FK.
        using var other = _db.CreateContext();
        other.Polizas.Add(NuevaPoliza("POL-0000011", cotizacion.Id));

        Assert.Throws<DbUpdateException>(() => other.SaveChanges());
    }

    [Fact]
    public void A_payment_can_have_only_one_invoice()
    {
        using var context = _db.CreateContext();
        context.Facturas.AddRange(
            new Factura { PagoId = SeedData.PagoId, Numero = "0001-00000001", Importe = 1m },
            new Factura { PagoId = SeedData.PagoId, Numero = "0001-00000002", Importe = 1m });

        Assert.Throws<DbUpdateException>(() => context.SaveChanges());
    }

    private static Poliza NuevaPoliza(string numero, Guid cotizacionId) => new()
    {
        Numero = numero,
        ClienteId = SeedData.ClienteId,
        VehiculoId = SeedData.VehiculoId,
        PlanId = SeedData.PlanRcId,
        CotizacionId = cotizacionId,
        VigenciaMeses = 1,
        // The seeded vehicle already has a Vigente policy: an inactive state keeps the RN04 index out
        // of the way, so only the quote index is under test.
        Estado = EstadoPoliza.Cancelada
    };
}
