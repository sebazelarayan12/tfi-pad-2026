using Aseguradora.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Aseguradora.Data.Configurations;

public class CuotaConfiguration : IEntityTypeConfiguration<Cuota>
{
    public void Configure(EntityTypeBuilder<Cuota> builder)
    {
        builder.Property(e => e.RowVersion).IsRowVersion();

        builder.ToTable("Cuotas");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Importe).HasPrecision(18, 2);
        builder.Property(c => c.Recargo).HasPrecision(18, 2);

        builder.HasIndex(c => new { c.PolizaId, c.Numero }).IsUnique();

        builder.HasOne(c => c.Poliza)
            .WithMany(p => p.Cuotas)
            .HasForeignKey(c => c.PolizaId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
