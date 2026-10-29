using System.ComponentModel.DataAnnotations;

namespace Aseguradora.Application.Dtos.Polizas;

/// <summary>Request to cancel a policy (CU12, RN13).</summary>
public sealed record CancelarPolizaRequest
{
    private readonly string _motivo = string.Empty;

    /// <summary>
    /// Why the policy is cancelled; required, up to 200 characters. Surrounding spaces are removed
    /// before validation, so they do not count toward the limit.
    /// </summary>
    [Required(AllowEmptyStrings = false)]
    [StringLength(200)]
    public string Motivo
    {
        get => _motivo;
        init => _motivo = value?.Trim() ?? string.Empty;
    }
}
