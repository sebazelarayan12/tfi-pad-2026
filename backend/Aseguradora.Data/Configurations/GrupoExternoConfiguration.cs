using Aseguradora.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Aseguradora.Data.Configurations;

public class GrupoExternoConfiguration : IEntityTypeConfiguration<GrupoExterno>
{
    public void Configure(EntityTypeBuilder<GrupoExterno> builder)
    {
        builder.ToTable("GruposExternos");

        builder.HasKey(g => g.Id);

        builder.Property(g => g.Nombre).HasMaxLength(GrupoExterno.LongitudMaximaNombre).IsRequired();
        builder.Property(g => g.Email).HasMaxLength(256).IsUnicode(false).IsRequired();
        builder.Property(g => g.PasswordHash).HasMaxLength(256).IsUnicode(false).IsRequired();
        builder.Property(g => g.Contacto).HasMaxLength(GrupoExterno.LongitudMaximaContacto).IsRequired();
        builder.Property(g => g.Descripcion).HasMaxLength(GrupoExterno.LongitudMaximaDescripcion).IsRequired();
        builder.Property(g => g.Estado).HasConversion<int>().IsRequired();
        builder.Property(g => g.Motivo).HasMaxLength(GrupoExterno.LongitudMaximaMotivo);
        builder.Property(g => g.ClaveHash).HasMaxLength(64).IsUnicode(false);
        builder.Property(g => g.ClavePrefijo).HasMaxLength(16).IsUnicode(false);

        builder.HasIndex(g => g.Email).IsUnique();
        // The name is compared case-insensitively by the database collation.
        builder.HasIndex(g => g.Nombre).IsUnique();
        // Looked up on every request that carries an API key.
        builder.HasIndex(g => g.ClaveHash).IsUnique().HasFilter("[ClaveHash] IS NOT NULL");
    }
}
