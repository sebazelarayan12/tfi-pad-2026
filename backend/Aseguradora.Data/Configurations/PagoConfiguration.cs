using Aseguradora.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Aseguradora.Data.Configurations;

public class PagoConfiguration : IEntityTypeConfiguration<Pago>
{
    public void Configure(EntityTypeBuilder<Pago> builder)
    {
        builder.ToTable("Pagos");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.ImporteTotal).HasPrecision(18, 2);
        builder.Property(p => p.Numero).HasMaxLength(20).IsUnicode(false).IsRequired();
        builder.Property(p => p.Proveedor).HasMaxLength(30).IsUnicode(false);
        builder.Property(p => p.IdExterno).HasMaxLength(100).IsUnicode(false);
        builder.Property(p => p.LinkPago).HasMaxLength(500);

        builder.HasIndex(p => p.Numero).IsUnique();

        // Unique only when present: SQL Server would otherwise allow a single NULL.
        builder.HasIndex(p => p.IdExterno).IsUnique().HasFilter("[IdExterno] IS NOT NULL");

        builder.HasOne(p => p.Cliente)
            .WithMany(c => c.Pagos)
            .HasForeignKey(p => p.ClienteId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.Rendicion)
            .WithMany(r => r.Pagos)
            .HasForeignKey(p => p.RendicionId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
