using Aseguradora.Api.Security;
using Aseguradora.Application.Comun;
using Aseguradora.Application.Dtos;
using Aseguradora.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Aseguradora.Api.Controllers;

/// <summary>
/// Global installment list (PB-24). Requires employee or administrator permissions.
/// </summary>
[ApiController]
[Route("api/cuotas")]
[Authorize(Policy = Politicas.Empleado)]
public sealed class CuotasController(ICuotaConsultaService consulta) : ControllerBase
{
    /// <summary>Lists installments of every policy, oldest due date first (for example overdue ones with <c>estado=Vencida</c>).</summary>
    [HttpGet]
    [ProducesResponseType(typeof(PaginaResponse<CuotaListItemResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<PaginaResponse<CuotaListItemResponse>>> Listar(
        [FromQuery] CuotaFiltro filtro, CancellationToken ct) =>
        Ok(await consulta.ListarAsync(filtro, ct));
}
