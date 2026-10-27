using Aseguradora.Domain.Enums;
using Aseguradora.Tests.Data;
using Microsoft.EntityFrameworkCore;

namespace Aseguradora.Tests.Builders;

/// <summary>
/// The builders must produce entities the real model accepts. There is no domain validation yet, so
/// "valid" means: saved in a database that enforces the real foreign keys and unique indexes.
/// </summary>
public class BuildersTests
{
    [Fact]
    public async Task Builders_ValoresPorDefecto_SonEntidadesValidas()
    {
        using var db = new SqliteDbFixture();
        await using var contexto = db.CreateContext();

        var cliente = new ClienteBuilder().Construir();
        var vehiculo = new VehiculoBuilder().DeCliente(cliente).Construir();
        var plan = new PlanBuilder().Construir();
        var poliza = new PolizaBuilder().Para(cliente, vehiculo, plan).Construir();
        var cuotas = Enumerable.Range(1, 3)
            .Select(numero => new CuotaBuilder().DePoliza(poliza).Numero(numero).Construir())
            .ToList();

        contexto.AddRange(cliente, vehiculo, plan, poliza);
        contexto.AddRange(cuotas);
        await contexto.SaveChangesAsync();

        Assert.Equal(3, await contexto.Cuotas.CountAsync(c => c.PolizaId == poliza.Id));
    }

    [Fact]
    public async Task Builders_VariasConstrucciones_NoChocanConLosIndicesUnicosNiConElSeed()
    {
        using var db = new SqliteDbFixture();
        await using var contexto = db.CreateContext();

        var clientes = Enumerable.Range(0, 5).Select(_ => new ClienteBuilder().Construir()).ToList();
        var vehiculos = clientes.Select(c => new VehiculoBuilder().DeCliente(c).Construir()).ToList();
        var planes = Enumerable.Range(0, 5).Select(_ => new PlanBuilder().Construir()).ToList();

        contexto.AddRange(clientes);
        contexto.AddRange(vehiculos);
        contexto.AddRange(planes);

        // The seed already holds a client, a vehicle and a plan; the new ones sit next to them.
        await contexto.SaveChangesAsync();
        Assert.Equal(6, await contexto.Clientes.CountAsync());
    }

    [Fact]
    public void Builders_ValoresPorDefecto_CumplenRN01RN03YRN07()
    {
        var cliente = new ClienteBuilder().Construir();
        var vehiculo = new VehiculoBuilder().Construir();
        var poliza = new PolizaBuilder().Construir();
        var cuota = new CuotaBuilder().Construir();

        // RN01: adult client. RN03: validated vehicle. RN07: Pendiente policy, Pendiente first installment.
        Assert.True(cliente.FechaNacimiento <= DateOnly.FromDateTime(DateTime.UtcNow).AddYears(-18));
        Assert.True(cliente.ValidadoRenaper);
        Assert.True(vehiculo.ValidadoDnrpa);
        Assert.Equal(EstadoPoliza.Pendiente, poliza.Estado);
        Assert.Equal(poliza.FechaInicio.AddMonths(poliza.VigenciaMeses), poliza.FechaFin);
        Assert.Equal(EstadoCuota.Pendiente, cuota.Estado);
        Assert.Equal(1, cuota.Numero);
    }

    [Fact]
    public void Con_SobrescribeUnCampo()
    {
        var plan = new PlanBuilder().Con(p => p.Activo = false).Construir();

        Assert.False(plan.Activo);
    }

    [Fact]
    public void Con_ConAjusteNulo_LanzaArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => new PlanBuilder().Con(null!));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("  ")]
    public void ConDniYConPatente_ConValorNuloOVacio_LanzanArgumentException(string? valor)
    {
        Assert.ThrowsAny<ArgumentException>(() => new ClienteBuilder().ConDni(valor!));
        Assert.ThrowsAny<ArgumentException>(() => new VehiculoBuilder().ConPatente(valor!));
    }

    [Fact]
    public void RelacionesYNumero_ConArgumentosInvalidos_Lanzan()
    {
        Assert.Throws<ArgumentNullException>(() => new VehiculoBuilder().DeCliente(null!));
        Assert.Throws<ArgumentNullException>(() => new CuotaBuilder().DePoliza(null!));
        Assert.Throws<ArgumentNullException>(() => new PolizaBuilder().Para(null!, null!, null!));
        Assert.Throws<ArgumentOutOfRangeException>(() => new CuotaBuilder().Numero(0));
    }
}
