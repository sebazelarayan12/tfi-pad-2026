using Aseguradora.Application.Services;
using Aseguradora.Data;
using Aseguradora.Data.Repositories;
using Aseguradora.Data.Seed;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Tests.Builders;
using Aseguradora.Tests.Fakes;

namespace Aseguradora.Tests.Support;

/// <summary>Shared setup of the policy query and cancellation tests (US-F3-03).</summary>
internal static class PolizasDePrueba
{
    /// <summary>12:00 in Argentina (UTC-3) on 29/10/2026.</summary>
    public static readonly DateTimeOffset Ahora = new(2026, 10, 29, 15, 0, 0, TimeSpan.Zero);

    public static PolizaService CrearServicio(AseguradoraDbContext context) => new(
        new EfRepository<Cotizacion>(context),
        new EfRepository<Cliente>(context),
        new EfRepository<Vehiculo>(context),
        new EfRepository<Plan>(context),
        new EfRepository<Poliza>(context),
        new EfRepository<Cuota>(context),
        // The seeded policy already is POL-0000001.
        new NumeradorPolizasFalso(primero: 2),
        new UnitOfWork(context),
        new RelojFalso(Ahora));

    /// <summary>
    /// Saves a policy of a new client and vehicle (plan RC), with one Pendiente installment per month.
    /// </summary>
    public static async Task<Poliza> AgregarPolizaAsync(
        AseguradoraDbContext context, EstadoPoliza estado, DateTime fechaEmision)
    {
        var cliente = new ClienteBuilder().Construir();
        var vehiculo = new VehiculoBuilder().DeCliente(cliente).Construir();
        var plan = await context.Planes.FindAsync(SeedData.PlanRcId)
            ?? throw new InvalidOperationException("The seed has no RC plan.");
        var poliza = new PolizaBuilder()
            .Para(cliente, vehiculo, plan)
            .Con(p =>
            {
                p.Estado = estado;
                p.FechaEmision = fechaEmision;
            })
            .Construir();
        for (var numero = 1; numero <= poliza.VigenciaMeses; numero++)
            poliza.Cuotas.Add(new CuotaBuilder().DePoliza(poliza).Numero(numero).Construir());

        context.Polizas.Add(poliza);
        await context.SaveChangesAsync();
        return poliza;
    }
}
