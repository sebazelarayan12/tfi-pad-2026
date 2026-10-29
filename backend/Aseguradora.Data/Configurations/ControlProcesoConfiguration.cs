using Aseguradora.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Aseguradora.Data.Configurations;

public class ControlProcesoConfiguration : IEntityTypeConfiguration<ControlProceso>
{
    public void Configure(EntityTypeBuilder<ControlProceso> builder)
    {
        builder.ToTable("ControlesProceso");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Nombre).HasMaxLength(50).IsUnicode(false).IsRequired();

        // One row per process.
        builder.HasIndex(c => c.Nombre).IsUnique();
    }
}
