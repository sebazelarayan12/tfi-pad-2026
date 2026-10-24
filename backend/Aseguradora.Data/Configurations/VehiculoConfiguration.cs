using Aseguradora.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Aseguradora.Data.Configurations;

public class VehiculoConfiguration : IEntityTypeConfiguration<Vehiculo>
{
    public void Configure(EntityTypeBuilder<Vehiculo> builder)
    {
        builder.ToTable("Vehiculos");

        builder.HasKey(v => v.Id);

        builder.Property(v => v.Patente).HasMaxLength(7).IsUnicode(false).IsRequired();
        builder.Property(v => v.Marca).HasMaxLength(60).IsRequired();
        builder.Property(v => v.Modelo).HasMaxLength(60).IsRequired();
        builder.Property(v => v.NumeroMotor).HasMaxLength(30).IsUnicode(false).IsRequired();
        builder.Property(v => v.NumeroChasis).HasMaxLength(30).IsUnicode(false).IsRequired();

        builder.HasIndex(v => v.Patente).IsUnique();

        builder.HasOne(v => v.Cliente)
            .WithMany(c => c.Vehiculos)
            .HasForeignKey(v => v.ClienteId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
