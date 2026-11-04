using Aseguradora.Application.Services;
using Aseguradora.Domain.Enums;
using Aseguradora.Tests.Builders;

namespace Aseguradora.Tests.Application;

public sealed class MotorCotizacionTests
{
    [Theory]
    [InlineData(1985, 3, 21, 2026, 3, 20, 40)]
    [InlineData(1985, 3, 21, 2026, 3, 21, 41)]
    [InlineData(1985, 3, 21, 2026, 10, 29, 41)]
    [InlineData(2026, 10, 29, 2026, 10, 29, 0)]
    public void CalcularEdad_cuenta_anios_cumplidos(int ay, int am, int ad, int hy, int hm, int hd, int esperada) =>
        Assert.Equal(esperada, MotorCotizacion.CalcularEdad(new DateOnly(ay, am, ad), new DateOnly(hy, hm, hd)));

    [Fact]
    public void EsCompatible_ignora_mayusculas_y_espacios_en_los_tipos()
    {
        var plan = new PlanBuilder().Con(p => p.TiposPermitidos = " auto , CAMIONETA ").Construir();

        Assert.True(MotorCotizacion.EsCompatible(plan, TipoVehiculo.Auto, antiguedad: 0));
        Assert.True(MotorCotizacion.EsCompatible(plan, TipoVehiculo.Camioneta, antiguedad: 0));
        Assert.False(MotorCotizacion.EsCompatible(plan, TipoVehiculo.Moto, antiguedad: 0));
    }

    [Fact]
    public void EsCompatible_rechaza_planes_inactivos()
    {
        var plan = new PlanBuilder().Con(p => p.Activo = false).Construir();

        Assert.False(MotorCotizacion.EsCompatible(plan, TipoVehiculo.Auto, antiguedad: 0));
    }

    [Theory]
    [InlineData(10, true)]
    [InlineData(11, false)]
    public void EsCompatible_aplica_la_antiguedad_maxima_de_forma_inclusiva(int antiguedad, bool esperado)
    {
        var plan = new PlanBuilder().Con(p => p.AntiguedadMaxima = 10).Construir();

        Assert.Equal(esperado, MotorCotizacion.EsCompatible(plan, TipoVehiculo.Auto, antiguedad));
    }
}
