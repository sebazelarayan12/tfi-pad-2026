namespace Aseguradora.Domain.Services;

/// <summary>Surcharge applied once to an installment that becomes overdue (RN08).</summary>
public static class TasaRecargoMora
{
    public const decimal Valor = 0.05m;

    /// <summary>Surcharge of an installment, rounded to cents (half away from zero).</summary>
    public static decimal Calcular(decimal importe) =>
        Math.Round(importe * Valor, 2, MidpointRounding.AwayFromZero);
}
