using System.ComponentModel.DataAnnotations;

namespace Aseguradora.Application.Dtos;

/// <summary>Aviso de resultado de una pasarela (contratos 9.3 y 9.5 B).</summary>
public sealed record PasarelaWebhookRequest
{
    [Required, StringLength(100)]
    public string IdPago { get; init; } = string.Empty;
    [StringLength(20)]
    public string? ReferenciaExterna { get; init; }
    [Required, RegularExpression("^(APROBADO|RECHAZADO|CANCELADO)$")]
    public string Estado { get; init; } = string.Empty;
    [Range(typeof(decimal), "0.01", "9999999999999999.99",
        ParseLimitsInInvariantCulture = true, ConvertValueInInvariantCulture = true)]
    public decimal Importe { get; init; }
    public DateTimeOffset Fecha { get; init; }
    [StringLength(50)]
    public string? MedioPago { get; init; }
    public const int MaximoCuotas = 50;
    [MaxLength(MaximoCuotas)]
    public IReadOnlyList<Guid>? IdCuotas { get; init; }
}
