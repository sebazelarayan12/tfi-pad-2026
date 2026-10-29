using Aseguradora.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Aseguradora.Data.Configurations;

public class ClienteConfiguration : IEntityTypeConfiguration<Cliente>
{
    public void Configure(EntityTypeBuilder<Cliente> builder)
    {
        builder.ToTable("Clientes");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Dni).HasMaxLength(8).IsUnicode(false).IsRequired();
        builder.Property(c => c.Cuil).HasMaxLength(11).IsUnicode(false).IsRequired();
        builder.Property(c => c.Nombre).HasMaxLength(100).IsRequired();
        builder.Property(c => c.Apellido).HasMaxLength(100).IsRequired();
        builder.Property(c => c.Sexo).HasMaxLength(1).IsFixedLength().IsUnicode(false);
        builder.Property(c => c.Email).HasMaxLength(150).IsRequired();
        builder.Property(c => c.Telefono).HasMaxLength(20).IsUnicode(false);
        builder.Property(c => c.Calle).HasMaxLength(150).IsRequired();
        builder.Property(c => c.Numero).HasMaxLength(20).IsRequired();
        builder.Property(c => c.Localidad).HasMaxLength(100).IsRequired();
        builder.Property(c => c.Provincia).HasMaxLength(100).IsRequired();
        builder.Property(c => c.CodigoPostal).HasMaxLength(10).IsRequired();

        builder.HasIndex(c => c.Dni).IsUnique();
        builder.HasIndex(c => c.Email).IsUnique();
    }
}
