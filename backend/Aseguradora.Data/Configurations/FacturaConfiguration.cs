using Aseguradora.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Aseguradora.Data.Configurations;

public class FacturaConfiguration : IEntityTypeConfiguration<Factura>
{
    public void Configure(EntityTypeBuilder<Factura> builder)
    {
        builder.ToTable("Facturas");

        builder.HasKey(f => f.Id);

        builder.Property(f => f.Numero).HasMaxLength(13).IsUnicode(false).IsRequired();
        builder.Property(f => f.Tipo).HasMaxLength(1).IsFixedLength().IsUnicode(false);
        builder.Property(f => f.Importe).HasPrecision(18, 2);
        builder.Property(f => f.Cae).HasMaxLength(14).IsUnicode(false);

        // A payment is invoiced at most once (1 to 0..1).
        builder.HasOne(f => f.Pago)
            .WithOne(p => p.Factura)
            .HasForeignKey<Factura>(f => f.PagoId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
