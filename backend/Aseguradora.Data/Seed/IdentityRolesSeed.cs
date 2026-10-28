using Aseguradora.Application.Security;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Aseguradora.Data.Seed;

/// <summary>
/// Roles every database needs, with fixed ids so HasData stays stable across migrations.
/// Names come from <see cref="Roles"/> (Application), the single source (C10, US-F1-02).
/// </summary>
public static class IdentityRolesSeed
{
    public static readonly string AdministradorId = Guid.Parse("a0000000-0000-0000-0000-000000000001").ToString();
    public static readonly string EmpleadoId = Guid.Parse("a0000000-0000-0000-0000-000000000002").ToString();

    public static void Apply(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<IdentityRole>().HasData(
            CrearRol(AdministradorId, Roles.Administrador),
            CrearRol(EmpleadoId, Roles.Empleado));
    }

    private static IdentityRole CrearRol(string id, string nombre) => new()
    {
        Id = id,
        Name = nombre,
        NormalizedName = nombre.ToUpperInvariant()
    };
}
