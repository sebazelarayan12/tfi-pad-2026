using Aseguradora.Api.Security;
using Aseguradora.Application.Dtos;
using Aseguradora.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Aseguradora.Api.Controllers;

/// <summary>
/// Endpoints for vehicle registration and management (CU06, CU07, RN03).
/// Requires employee or administrator permissions (<see cref="Politicas.Empleado"/>).
/// </summary>
[ApiController]
[Route("api/vehiculos")]
[Authorize(Policy = Politicas.Empleado)]
public sealed class VehiculosController(IVehiculoService vehiculos) : ControllerBase
{
    private readonly IVehiculoService _vehiculos = vehiculos ?? throw new ArgumentNullException(nameof(vehiculos));

    /// <summary>
    /// Registers a vehicle for a client after validating ownership and vehicle data in DNRPA (CU06, RN03).
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(VehiculoResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status502BadGateway)]
    public async Task<ActionResult<VehiculoResponse>> Alta(VehiculoAltaRequest request, CancellationToken ct)
    {
        var creado = await _vehiculos.AltaAsync(request, ct);
        return Created($"/api/vehiculos/{creado.Id}", creado);
    }

    /// <summary>
    /// Lists the active vehicles of a client (CU07). The <c>clienteId</c> query parameter is required.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<VehiculoResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<IReadOnlyList<VehiculoResponse>>> Listar([FromQuery] Guid? clienteId, CancellationToken ct)
    {
        if (clienteId is null || clienteId == Guid.Empty)
            return Problem(
                title: "Solicitud inválida",
                detail: "El parámetro 'clienteId' es obligatorio.",
                statusCode: StatusCodes.Status400BadRequest);

        return Ok(await _vehiculos.ListarPorClienteAsync(clienteId.Value, ct));
    }

    /// <summary>
    /// Gets a vehicle by id. A deactivated vehicle is returned with <c>activo = false</c> for traceability.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(VehiculoResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<VehiculoResponse>> Obtener(Guid id, CancellationToken ct) =>
        Ok(await _vehiculos.ObtenerAsync(id, ct));

    /// <summary>
    /// Changes the declared use of a vehicle (CU07). It does not affect quotes or policies already issued.
    /// </summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(VehiculoResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<VehiculoResponse>> ModificarUso(Guid id, ModificarUsoRequest request, CancellationToken ct) =>
        Ok(await _vehiculos.ModificarUsoAsync(id, request.Uso!.Value, ct));

    /// <summary>
    /// Soft-deletes a vehicle (RN15). Rejected with 400 when it has a Pendiente, Vigente or Suspendida policy (RN04).
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DarDeBaja(Guid id, CancellationToken ct)
    {
        await _vehiculos.DarDeBajaAsync(id, ct);
        return NoContent();
    }
}
