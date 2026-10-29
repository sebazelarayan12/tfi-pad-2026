using Aseguradora.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Aseguradora.Data.Configurations;

public class PlanConfiguration : IEntityTypeConfiguration<Plan>
{
    public void Configure(EntityTypeBuilder<Plan> builder)
    {
        builder.ToTable("Planes");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Codigo).HasMaxLength(10).IsUnicode(false).IsRequired();
        builder.Property(p => p.Nombre).HasMaxLength(80).IsRequired();
        builder.Property(p => p.Descripcion).HasMaxLength(500).IsRequired();
        builder.Property(p => p.PrimaBase).HasPrecision(18, 2);
        builder.Property(p => p.TiposPermitidos).HasMaxLength(50).IsUnicode(false).IsRequired();

        builder.HasIndex(p => p.Codigo).IsUnique();
    }
}
