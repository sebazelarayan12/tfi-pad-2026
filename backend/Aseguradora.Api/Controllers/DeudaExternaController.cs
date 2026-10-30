using Aseguradora.Api.Security;
using Aseguradora.Application.Dtos;
using Aseguradora.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Aseguradora.Api.Controllers;

/// <summary>
/// Debt of a client for external systems with an API key, so they can offer the payment (CU13, spec 9.5 B).
/// Its own controller so it does not collide with the external endpoints of Frente 3 (C7).
/// </summary>
[ApiController]
[Route("api/externo/clientes")]
[Authorize(Policy = Politicas.ApiKey)]
public sealed class DeudaExternaController(IDeudaExternaService deudas) : ControllerBase
{
    /// <summary>Unpaid installments of the client with that DNI. 404 with codigo CLIENTE_NO_ENCONTRADO when there is no such client.</summary>
    [HttpGet("{dni}/deuda")]
    [ProducesResponseType(typeof(DeudaExternaResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<DeudaExternaResponse>> Deuda(string dni, CancellationToken ct) =>
        Ok(await deudas.ObtenerDeudaAsync(dni, ct));
}
