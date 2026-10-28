using Aseguradora.Application.Services;
using Aseguradora.Domain.Enums;

namespace Aseguradora.Tests.Application;

public class CalculoPrimaTests
{
    [Theory]
    [InlineData(10000, 9100.00)]
    [InlineData(18000, 16380.00)]
    public void Calcular_ejemplo_9_5_C_devuelve_9100_para_RC_y_16380_para_TC(
        decimal primaBase,
        decimal primaEsperada)
    {
        var prima = CalculoPrima.Calcular(
            primaBase,
            TipoVehiculo.Moto,
            anioVehiculo: 2024,
            anioReferencia: 2026,
            edadConductor: 23,
            UsoVehiculo.Particular);

        Assert.Equal(primaEsperada, prima);
    }

    [Theory]
    [InlineData(24, 13000.00)]
    [InlineData(25, 10000.00)]
    [InlineData(65, 10000.00)]
    [InlineData(66, 11500.00)]
    public void Calcular_aplica_factor_de_edad_en_los_limites(
        int edadConductor,
        decimal primaEsperada)
    {
        var prima = CalculoPrima.Calcular(
            primaBase: 10000m,
            TipoVehiculo.Auto,
            anioVehiculo: 2026,
            anioReferencia: 2026,
            edadConductor,
            UsoVehiculo.Particular);

        Assert.Equal(primaEsperada, prima);
    }

    [Theory]
    [InlineData(2026, 2026, 10000.00)]
    [InlineData(2021, 2026, 10000.00)]
    [InlineData(2020, 2026, 11000.00)]
    [InlineData(2016, 2026, 11000.00)]
    [InlineData(2015, 2026, 12500.00)]
    public void Calcular_aplica_factor_de_antiguedad_en_los_limites(
        int anioVehiculo,
        int anioReferencia,
        decimal primaEsperada)
    {
        var prima = CalculoPrima.Calcular(
            primaBase: 10000m,
            TipoVehiculo.Auto,
            anioVehiculo,
            anioReferencia,
            edadConductor: 30,
            UsoVehiculo.Particular);

        Assert.Equal(primaEsperada, prima);
    }

    [Theory]
    [InlineData(TipoVehiculo.Auto, UsoVehiculo.Particular, 10000.00)]
    [InlineData(TipoVehiculo.Moto, UsoVehiculo.Particular, 7000.00)]
    [InlineData(TipoVehiculo.Camioneta, UsoVehiculo.Particular, 12000.00)]
    [InlineData(TipoVehiculo.Auto, UsoVehiculo.Comercial, 14000.00)]
    [InlineData(TipoVehiculo.Moto, UsoVehiculo.Comercial, 9800.00)]
    [InlineData(TipoVehiculo.Camioneta, UsoVehiculo.Comercial, 16800.00)]
    public void Calcular_aplica_factores_de_tipo_y_uso(
        TipoVehiculo tipo,
        UsoVehiculo uso,
        decimal primaEsperada)
    {
        var prima = CalculoPrima.Calcular(
            primaBase: 10000m,
            tipo,
            anioVehiculo: 2026,
            anioReferencia: 2026,
            edadConductor: 30,
            uso);

        Assert.Equal(primaEsperada, prima);
    }

    [Fact]
    public void Calcular_redondea_a_dos_decimales_away_from_zero()
    {
        // 100.05 * 1.10 (age 6) = 110.055 -> 110.06 with AwayFromZero (110.05 with ToEven falls to .06, whereas 100.045 -> 100.05)
        // Base 91.322727... simpler: Base = 100.05m, Auto (1.0), Antiguedad 6 (1.10) => 100.05 * 1.10 = 110.055 => 110.06
        // Also test an even hundredth midpoint: 100.045m * 1.0 = 100.045 => AwayFromZero gives 100.05 (ToEven would give 100.04).
        var prima = CalculoPrima.Calcular(
            primaBase: 100.045m,
            TipoVehiculo.Auto,
            anioVehiculo: 2026,
            anioReferencia: 2026,
            edadConductor: 30,
            UsoVehiculo.Particular);

        Assert.Equal(100.05m, prima);
    }

    [Fact]
    public void Calcular_con_anio_futuro_trata_la_antiguedad_como_cero()
    {
        var prima = CalculoPrima.Calcular(
            primaBase: 10000m,
            TipoVehiculo.Auto,
            anioVehiculo: 2027,
            anioReferencia: 2026,
            edadConductor: 30,
            UsoVehiculo.Particular);

        Assert.Equal(10000.00m, prima);
    }
}
