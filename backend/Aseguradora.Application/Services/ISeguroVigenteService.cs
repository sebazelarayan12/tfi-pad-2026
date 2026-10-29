using Aseguradora.Application.Dtos.Externo;

namespace Aseguradora.Application.Services;

/// <summary>Tells external systems whether a vehicle has a Vigente policy today (CU19, RN10).</summary>
public interface ISeguroVigenteService
{
    /// <exception cref="Exceptions.BusinessRuleException">The plate does not match AB123CD or ABC123.</exception>
    Task<SeguroVigenteResponse> ConsultarAsync(string patente, DateOnly hoy, CancellationToken ct = default);
}
