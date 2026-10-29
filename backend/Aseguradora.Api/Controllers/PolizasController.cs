using Aseguradora.Api.Security;
using Aseguradora.Application.Comun;
using Aseguradora.Application.Dtos.Polizas;
using Aseguradora.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Aseguradora.Api.Controllers;

/// <summary>
/// Endpoints to issue, query and cancel policies and to see their installments (CU10 to CU13).
/// Requires employee or administrator permissions (<see cref="Politicas.Empleado"/>, RN17).
/// </summary>
[ApiController]
[Route("api/polizas")]
[Authorize(Policy = Politicas.Empleado)]
public sealed class PolizasController(IPolizaService polizas) : ControllerBase
{
    private readonly IPolizaService _polizas = polizas ?? throw new ArgumentNullException(nameof(polizas));

    /// <summary>Issues a Pendiente policy with its installments from a quote (CU10).</summary>
    [HttpPost]
    [ProducesResponseType(typeof(PolizaDetalleResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PolizaDetalleResponse>> Emitir(EmitirPolizaRequest request, CancellationToken ct)
    {
        var emitida = await _polizas.EmitirAsync(request, ct);
        return Created($"/api/polizas/{emitida.Id}", emitida);
    }

    /// <summary>Lists policies, newest first, filtered by state, client and plate (CU11).</summary>
    [HttpGet]
    [ProducesResponseType(typeof(PaginaResponse<PolizaListItemResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<PaginaResponse<PolizaListItemResponse>>> Listar(
        [FromQuery] PolizaFiltro filtro, CancellationToken ct) =>
        Ok(await _polizas.ListarAsync(filtro, ct));

    /// <summary>Gets a policy with its vehicle, plan and installments (CU11).</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(PolizaDetalleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PolizaDetalleResponse>> Obtener(Guid id, CancellationToken ct) =>
        Ok(await _polizas.ObtenerAsync(id, ct));

    /// <summary>Cancels a policy and voids its unpaid installments (CU12, RN13).</summary>
    [HttpPost("{id:guid}/cancelar")]
    [ProducesResponseType(typeof(PolizaDetalleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PolizaDetalleResponse>> Cancelar(
        Guid id, CancelarPolizaRequest request, CancellationToken ct) =>
        Ok(await _polizas.CancelarAsync(id, request, ct));

    /// <summary>Gets the installments of a policy ordered by number (CU13).</summary>
    [HttpGet("{id:guid}/cuotas")]
    [ProducesResponseType(typeof(IReadOnlyList<CuotaResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IReadOnlyList<CuotaResponse>>> ObtenerCuotas(Guid id, CancellationToken ct) =>
        Ok(await _polizas.ObtenerCuotasAsync(id, ct));
}
