using Aseguradora.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Aseguradora.Data.Configurations;

public class PolizaConfiguration : IEntityTypeConfiguration<Poliza>
{
    public void Configure(EntityTypeBuilder<Poliza> builder)
    {
        builder.ToTable("Polizas");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Numero).HasMaxLength(12).IsUnicode(false).IsRequired();
        builder.Property(p => p.PrimaMensual).HasPrecision(18, 2);
        builder.Property(p => p.MotivoCancelacion).HasMaxLength(200);

        builder.HasIndex(p => p.Numero).IsUnique();

        builder.HasOne(p => p.Cliente)
            .WithMany(c => c.Polizas)
            .HasForeignKey(p => p.ClienteId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.Vehiculo)
            .WithMany(v => v.Polizas)
            .HasForeignKey(p => p.VehiculoId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.Plan)
            .WithMany(pl => pl.Polizas)
            .HasForeignKey(p => p.PlanId)
            .OnDelete(DeleteBehavior.Restrict);

        // A quote is used to issue at most one policy (1 to 0..1).
        builder.HasOne(p => p.Cotizacion)
            .WithOne(c => c.Poliza)
            .HasForeignKey<Poliza>(p => p.CotizacionId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
