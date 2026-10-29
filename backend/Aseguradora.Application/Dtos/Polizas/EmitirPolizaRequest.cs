namespace Aseguradora.Application.Dtos.Polizas;

/// <summary>
/// Request to issue a policy from an existing quote (CU10).
/// </summary>
/// <param name="CotizacionId">Identifier of the quote the policy is issued from.</param>
/// <param name="VigenciaMeses">Policy term in months: 1, 6 or 12 (RN07).</param>
public sealed record EmitirPolizaRequest(Guid CotizacionId, int VigenciaMeses);
