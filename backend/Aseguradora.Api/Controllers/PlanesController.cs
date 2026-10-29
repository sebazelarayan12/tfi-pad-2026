using Aseguradora.Api.Security;
using Aseguradora.Application.Dtos;
using Aseguradora.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Aseguradora.Api.Controllers;

/// <summary>
/// Endpoints for querying and managing insurance coverage plans (CU08, RN05, RN15).
/// Public read access lists only active plans; write operations require administrator permissions.
/// </summary>
[ApiController]
[Route("api/planes")]
public sealed class PlanesController(IPlanService planes) : ControllerBase
{
    private readonly IPlanService _planes = planes ?? throw new ArgumentNullException(nameof(planes));

    /// <summary>Lists all active coverage plans.</summary>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(IReadOnlyList<PlanResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<PlanResponse>>> Listar(CancellationToken ct) =>
        Ok(await _planes.ListarActivosAsync(ct));

    /// <summary>Gets an active coverage plan by its identifier.</summary>
    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PlanResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PlanResponse>> Obtener(Guid id, CancellationToken ct) =>
        Ok(await _planes.ObtenerActivoAsync(id, ct));

    /// <summary>Creates a new coverage plan. Administrator only.</summary>
    [HttpPost]
    [Authorize(Policy = Politicas.Admin)]
    [ProducesResponseType(typeof(PlanResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<PlanResponse>> Crear(PlanRequest request, CancellationToken ct)
    {
        var creado = await _planes.CrearAsync(request, ct);
        return CreatedAtAction(nameof(Obtener), new { id = creado.Id }, creado);
    }

    /// <summary>Updates an existing coverage plan. Administrator only.</summary>
    [HttpPut("{id:guid}")]
    [Authorize(Policy = Politicas.Admin)]
    [ProducesResponseType(typeof(PlanResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<PlanResponse>> Actualizar(Guid id, PlanRequest request, CancellationToken ct) =>
        Ok(await _planes.ActualizarAsync(id, request, ct));

    /// <summary>Soft-deletes a coverage plan by marking it inactive (RN15). Administrator only.</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = Politicas.Admin)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Desactivar(Guid id, CancellationToken ct)
    {
        await _planes.DesactivarAsync(id, ct);
        return NoContent();
    }
}
