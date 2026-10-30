using Aseguradora.Application.Exceptions;
using Aseguradora.Application.Publico.DTOs;

namespace Aseguradora.Application.Publico;

/// <summary>Public query of a policy and its installments (CU02).</summary>
public interface IConsultaPublicaService
{
    /// <summary>Returns the policy and its installments when the DNI owns the policy.</summary>
    /// <exception cref="NotFoundException">
    /// The DNI does not exist, or the policy does not belong to it. Both cases throw the same message (RN20).
    /// </exception>
    Task<ConsultaPublicaResponse> ConsultarAsync(ConsultaPublicaRequest request, CancellationToken ct = default);
}
