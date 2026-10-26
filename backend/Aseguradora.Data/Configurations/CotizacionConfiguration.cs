using Aseguradora.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Aseguradora.Data.Configurations;

public class CotizacionConfiguration : IEntityTypeConfiguration<Cotizacion>
{
    public void Configure(EntityTypeBuilder<Cotizacion> builder)
    {
        builder.ToTable("Cotizaciones");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.PrimaMensual).HasPrecision(18, 2);

        builder.HasOne(c => c.Plan)
            .WithMany(p => p.Cotizaciones)
            .HasForeignKey(c => c.PlanId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.Cliente)
            .WithMany()
            .HasForeignKey(c => c.ClienteId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.Vehiculo)
            .WithMany()
            .HasForeignKey(c => c.VehiculoId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
