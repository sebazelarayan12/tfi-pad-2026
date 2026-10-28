using Aseguradora.Data.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Aseguradora.Data.Configurations;

public class UsuarioConfiguration : IEntityTypeConfiguration<Usuario>
{
    public void Configure(EntityTypeBuilder<Usuario> builder)
    {
        builder.Property(u => u.Nombre).HasMaxLength(Usuario.LongitudMaximaNombre).IsRequired();
        builder.Property(u => u.Apellido).HasMaxLength(Usuario.LongitudMaximaNombre).IsRequired();
    }
}
