using System.ComponentModel.DataAnnotations;

namespace Aseguradora.Application.Dtos.Polizas;

/// <summary>Request to cancel a policy (CU12, RN13).</summary>
public sealed record CancelarPolizaRequest
{
    /// <summary>Why the policy is cancelled; required, up to 200 characters.</summary>
    [Required(AllowEmptyStrings = false)]
    [StringLength(200)]
    public string Motivo { get; init; } = string.Empty;
}
