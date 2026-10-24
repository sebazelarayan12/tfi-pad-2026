using Aseguradora.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Aseguradora.Data.Configurations;

public class PagoCuotaConfiguration : IEntityTypeConfiguration<PagoCuota>
{
    public void Configure(EntityTypeBuilder<PagoCuota> builder)
    {
        builder.ToTable("PagoCuotas");

        builder.HasKey(pc => new { pc.PagoId, pc.CuotaId });

        builder.Property(pc => pc.Importe).HasPrecision(18, 2);

        builder.HasOne(pc => pc.Pago)
            .WithMany(p => p.PagoCuotas)
            .HasForeignKey(pc => pc.PagoId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(pc => pc.Cuota)
            .WithMany(c => c.PagoCuotas)
            .HasForeignKey(pc => pc.CuotaId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
