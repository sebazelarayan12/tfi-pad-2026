using Aseguradora.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Aseguradora.Data.Configurations;

public class RendicionPagoFacilConfiguration : IEntityTypeConfiguration<RendicionPagoFacil>
{
    public void Configure(EntityTypeBuilder<RendicionPagoFacil> builder)
    {
        builder.ToTable("RendicionesPagoFacil");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.NombreArchivo).HasMaxLength(100).IsRequired();
        builder.Property(r => r.ImporteTotal).HasPrecision(18, 2);

        // The same settlement file must not be processed twice.
        builder.HasIndex(r => r.NombreArchivo).IsUnique();
    }
}
