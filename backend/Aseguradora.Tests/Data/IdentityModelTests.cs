using Aseguradora.Application.Security;
using Aseguradora.Data.Identity;
using Aseguradora.Data.Seed;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Aseguradora.Tests.Data;

public class IdentityModelTests
{
    [Fact]
    public void Modelo_IncluyeLasTablasDeIdentity()
    {
        using var db = new SqliteDbFixture();
        using var context = db.CreateContext();

        var tablas = context.Model.GetEntityTypes()
            .Select(entidad => entidad.GetTableName())
            .ToHashSet();

        Assert.Contains("AspNetUsers", tablas);
        Assert.Contains("AspNetRoles", tablas);
        Assert.Contains("AspNetUserRoles", tablas);
        Assert.NotNull(context.Model.FindEntityType(typeof(Usuario)));
        Assert.NotNull(context.Model.FindEntityType(typeof(IdentityRole)));
        Assert.NotNull(context.Model.FindEntityType(typeof(IdentityUserRole<string>)));
    }

    [Fact]
    public async Task SeedData_ConservaLosDatosDeNegocio()
    {
        using var db = new SqliteDbFixture();
        await using var context = db.CreateContext();

        Assert.True(await context.Clientes.AnyAsync(cliente => cliente.Dni == "30123456"));
        Assert.True(await context.Polizas.AnyAsync(poliza => poliza.Numero == "POL-0000001"));

        var roles = await context.Roles.Select(rol => rol.Name).OrderBy(nombre => nombre).ToListAsync();
        Assert.Equal([Roles.Administrador, Roles.Empleado], roles);
    }
}
