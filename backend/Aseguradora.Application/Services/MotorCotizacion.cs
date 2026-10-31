using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;

namespace Aseguradora.Application.Services;

/// <summary>
/// Shared quoting engine: filters the plans compatible with a vehicle (RN05) and prices each one (RN06, RN16).
/// Used by the internal quote (CU09) and reused by the external quote.
/// </summary>
public static class MotorCotizacion
{
    /// <summary>
    /// Returns every active plan that accepts the vehicle type and whose maximum age covers the vehicle age (RN05),
    /// with its monthly premium, ordered by plan code.
    /// </summary>
    /// <param name="planes">Candidate plans.</param>
    /// <param name="tipo">Vehicle type.</param>
    /// <param name="anioVehiculo">Vehicle model year.</param>
    /// <param name="anioReferencia">Reference year, taken from the injected clock (RN16).</param>
    /// <param name="edadConductor">Driver age in years.</param>
    /// <param name="uso">Declared vehicle use.</param>
    public static IReadOnlyList<(Plan Plan, decimal PrimaMensual)> Cotizar(
        IEnumerable<Plan> planes,
        TipoVehiculo tipo,
        int anioVehiculo,
        int anioReferencia,
        int edadConductor,
        UsoVehiculo uso)
    {
        ArgumentNullException.ThrowIfNull(planes);

        var antiguedad = Math.Max(0, anioReferencia - anioVehiculo);

        return planes
            .Where(plan => EsCompatible(plan, tipo, antiguedad))
            .OrderBy(plan => plan.Codigo, StringComparer.OrdinalIgnoreCase)
            .Select(plan => (
                plan,
                CalculoPrima.Calcular(plan.PrimaBase, tipo, anioVehiculo, anioReferencia, edadConductor, uso)))
            .ToList();
    }

    /// <summary>
    /// Whether an active plan accepts the vehicle type and age (RN05). <c>AntiguedadMaxima</c> null means no limit.
    /// </summary>
    public static bool EsCompatible(Plan plan, TipoVehiculo tipo, int antiguedad)
    {
        ArgumentNullException.ThrowIfNull(plan);

        if (!plan.Activo)
            return false;

        if (plan.AntiguedadMaxima is { } maxima && antiguedad > maxima)
            return false;

        return plan.TiposPermitidos
            .Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
            .Any(parte => Enum.TryParse<TipoVehiculo>(parte, ignoreCase: true, out var permitido) && permitido == tipo);
    }

    /// <summary>Full years between the birth date and <paramref name="hoy"/>.</summary>
    public static int CalcularEdad(DateOnly fechaNacimiento, DateOnly hoy)
    {
        var edad = hoy.Year - fechaNacimiento.Year;
        if (hoy < fechaNacimiento.AddYears(edad))
            edad--;

        return Math.Max(0, edad);
    }
}
