using Aseguradora.Domain.Enums;

namespace Aseguradora.Application.Services;

/// <summary>
/// Pure calculation of the monthly insurance premium according to business rule RN06.
/// </summary>
public static class CalculoPrima
{
    private const decimal FactorTipoAuto = 1.00m;
    private const decimal FactorTipoMoto = 0.70m;
    private const decimal FactorTipoCamioneta = 1.20m;

    private const int LimiteAntiguedadBaja = 5;
    private const int LimiteAntiguedadMedia = 10;
    private const decimal FactorAntiguedadBaja = 1.00m;
    private const decimal FactorAntiguedadMedia = 1.10m;
    private const decimal FactorAntiguedadAlta = 1.25m;

    private const int EdadJovenMaxima = 24;
    private const int EdadAdultoMaxima = 65;
    private const decimal FactorEdadJoven = 1.30m;
    private const decimal FactorEdadAdulto = 1.00m;
    private const decimal FactorEdadMayor = 1.15m;

    private const decimal FactorUsoParticular = 1.00m;
    private const decimal FactorUsoComercial = 1.40m;

    private const int DecimalesMoneda = 2;

    /// <summary>
    /// Calculates the monthly premium by multiplying the base premium by the vehicle type, vehicle age,
    /// driver age, and vehicle use factors, rounded to two decimal places using <see cref="MidpointRounding.AwayFromZero"/> (RN06, RN16).
    /// </summary>
    /// <param name="primaBase">Base monthly premium of the plan.</param>
    /// <param name="tipo">Vehicle type (Auto, Moto, Camioneta).</param>
    /// <param name="anioVehiculo">Manufacturing year of the vehicle.</param>
    /// <param name="anioReferencia">Reference year used to compute vehicle age (never read from the system clock).</param>
    /// <param name="edadConductor">Age of the driver in years.</param>
    /// <param name="uso">Vehicle use (Particular, Comercial).</param>
    /// <returns>The calculated monthly premium rounded to 2 decimal places.</returns>
    public static decimal Calcular(
        decimal primaBase,
        TipoVehiculo tipo,
        int anioVehiculo,
        int anioReferencia,
        int edadConductor,
        UsoVehiculo uso)
    {
        var antiguedad = Math.Max(0, anioReferencia - anioVehiculo);

        var factorTipo = ObtenerFactorTipo(tipo);
        var factorAntiguedad = ObtenerFactorAntiguedad(antiguedad);
        var factorEdad = ObtenerFactorEdad(edadConductor);
        var factorUso = ObtenerFactorUso(uso);

        var prima = primaBase * factorTipo * factorAntiguedad * factorEdad * factorUso;
        return Math.Round(prima, DecimalesMoneda, MidpointRounding.AwayFromZero);
    }

    private static decimal ObtenerFactorTipo(TipoVehiculo tipo) => tipo switch
    {
        TipoVehiculo.Auto => FactorTipoAuto,
        TipoVehiculo.Moto => FactorTipoMoto,
        TipoVehiculo.Camioneta => FactorTipoCamioneta,
        _ => throw new ArgumentOutOfRangeException(nameof(tipo), tipo, "Tipo de vehículo no soportado.")
    };

    private static decimal ObtenerFactorAntiguedad(int antiguedad) => antiguedad switch
    {
        <= LimiteAntiguedadBaja => FactorAntiguedadBaja,
        <= LimiteAntiguedadMedia => FactorAntiguedadMedia,
        _ => FactorAntiguedadAlta
    };

    private static decimal ObtenerFactorEdad(int edadConductor) => edadConductor switch
    {
        <= EdadJovenMaxima => FactorEdadJoven,
        <= EdadAdultoMaxima => FactorEdadAdulto,
        _ => FactorEdadMayor
    };

    private static decimal ObtenerFactorUso(UsoVehiculo uso) => uso switch
    {
        UsoVehiculo.Particular => FactorUsoParticular,
        UsoVehiculo.Comercial => FactorUsoComercial,
        _ => throw new ArgumentOutOfRangeException(nameof(uso), uso, "Uso de vehículo no soportado.")
    };
}
