using Aseguradora.Data.Repositories;
using Aseguradora.Data.Seed;
using Aseguradora.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Aseguradora.Tests.Data;

public class RepositoryAndUnitOfWorkTests : IDisposable
{
    private readonly SqliteDbFixture _db = new();

    public void Dispose() => _db.Dispose();

    private static Plan NuevoPlan(string codigo) => new()
    {
        Codigo = codigo,
        Nombre = $"Plan {codigo}",
        Descripcion = "x",
        PrimaBase = 1000m,
        TiposPermitidos = "Auto"
    };

    [Fact]
    public async Task Repository_does_not_persist_until_the_unit_of_work_saves()
    {
        await using var context = _db.CreateContext();
        var repository = new EfRepository<Plan>(context);
        var unitOfWork = new UnitOfWork(context);

        await repository.AddAsync(NuevoPlan("TC"));

        await using (var other = _db.CreateContext())
            Assert.False(await other.Planes.AnyAsync(p => p.Codigo == "TC"));

        await unitOfWork.SaveChangesAsync();

        await using (var other = _db.CreateContext())
            Assert.True(await other.Planes.AnyAsync(p => p.Codigo == "TC"));
    }

    [Fact]
    public async Task Unit_of_work_saves_everything_or_nothing()
    {
        await using var context = _db.CreateContext();
        var plans = new EfRepository<Plan>(context);
        var unitOfWork = new UnitOfWork(context);

        await plans.AddAsync(NuevoPlan("TR"));
        await plans.AddAsync(NuevoPlan("RC")); // duplicates the seeded plan code

        await Assert.ThrowsAsync<DbUpdateException>(() => unitOfWork.SaveChangesAsync());

        await using var other = _db.CreateContext();
        Assert.False(await other.Planes.AnyAsync(p => p.Codigo == "TR"));
    }

    [Fact]
    public async Task Repository_reads_by_id_filters_and_checks_existence()
    {
        await using var context = _db.CreateContext();
        var clientes = new EfRepository<Cliente>(context);

        var cliente = await clientes.GetByIdAsync(SeedData.ClienteId);

        Assert.NotNull(cliente);
        Assert.Equal("30123456", cliente.Dni);
        Assert.Null(await clientes.GetByIdAsync(Guid.NewGuid()));
        Assert.Single(await clientes.GetAllAsync());
        Assert.Single(await clientes.FindAsync(c => c.Apellido == "Pérez"));
        Assert.True(await clientes.AnyAsync(c => c.Dni == "30123456"));
        Assert.False(await clientes.AnyAsync(c => c.Dni == "00000000"));
    }

    [Fact]
    public async Task Repository_updates_and_removes_entities()
    {
        await using var context = _db.CreateContext();
        var plans = new EfRepository<Plan>(context);
        var unitOfWork = new UnitOfWork(context);
        var plan = NuevoPlan("TC");
        await plans.AddAsync(plan);
        await unitOfWork.SaveChangesAsync();

        plan.Nombre = "Terceros Completo";
        plans.Update(plan);
        await unitOfWork.SaveChangesAsync();

        await using (var other = _db.CreateContext())
            Assert.Equal("Terceros Completo", (await other.Planes.SingleAsync(p => p.Codigo == "TC")).Nombre);

        plans.Remove(plan);
        await unitOfWork.SaveChangesAsync();

        await using (var other = _db.CreateContext())
            Assert.False(await other.Planes.AnyAsync(p => p.Codigo == "TC"));
    }

    [Fact]
    public async Task Query_exposes_navigation_properties_through_include()
    {
        await using var context = _db.CreateContext();
        var polizas = new EfRepository<Poliza>(context);

        var poliza = await polizas.Query().Include(p => p.Cuotas).Include(p => p.Vehiculo).SingleAsync();

        Assert.Equal(6, poliza.Cuotas.Count);
        Assert.Equal("AB123CD", poliza.Vehiculo.Patente);
    }

    [Fact]
    public async Task Entities_in_use_cannot_be_deleted_because_no_cascade_is_configured()
    {
        await using var context = _db.CreateContext();
        var cliente = await context.Clientes.SingleAsync();
        context.Clientes.Remove(cliente);

        await Assert.ThrowsAsync<DbUpdateException>(() => context.SaveChangesAsync());
    }
}
