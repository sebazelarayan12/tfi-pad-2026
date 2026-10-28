using Aseguradora.Data.Identity;
using Aseguradora.Data.Seed;
using Aseguradora.Domain.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Aseguradora.Data;

public class AseguradoraDbContext(DbContextOptions<AseguradoraDbContext> options) : IdentityDbContext<Usuario>(options)
{
    public DbSet<Cliente> Clientes => Set<Cliente>();
    public DbSet<Vehiculo> Vehiculos => Set<Vehiculo>();
    public DbSet<Plan> Planes => Set<Plan>();
    public DbSet<Cotizacion> Cotizaciones => Set<Cotizacion>();
    public DbSet<Poliza> Polizas => Set<Poliza>();
    public DbSet<Cuota> Cuotas => Set<Cuota>();
    public DbSet<Pago> Pagos => Set<Pago>();
    public DbSet<PagoCuota> PagoCuotas => Set<PagoCuota>();
    public DbSet<Factura> Facturas => Set<Factura>();
    public DbSet<RendicionPagoFacil> RendicionesPagoFacil => Set<RendicionPagoFacil>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AseguradoraDbContext).Assembly);
        SeedData.Apply(modelBuilder);
    }
}
