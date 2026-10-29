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
}
