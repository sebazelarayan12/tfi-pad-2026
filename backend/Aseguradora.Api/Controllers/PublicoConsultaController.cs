using Aseguradora.Application.Publico;
using Aseguradora.Application.Publico.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace Aseguradora.Api.Controllers;

/// <summary>
/// Public query of a policy and its installments (CU02). Inherits the route <c>api/publico</c> and, like
/// the rest of the prefix, is limited by the global RN20 rate limit with no attribute of its own (C15).
/// </summary>
public sealed class PublicoConsultaController(IConsultaPublicaService consultas) : PublicoController
{
    /// <summary>Shows the policy and its installments to the holder who queries with DNI and policy number.</summary>
    [HttpPost("consulta")]
    [ProducesResponseType(typeof(ConsultaPublicaResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<ConsultaPublicaResponse>> Consultar(ConsultaPublicaRequest request, CancellationToken ct) =>
        await consultas.ConsultarAsync(request, ct);
}
