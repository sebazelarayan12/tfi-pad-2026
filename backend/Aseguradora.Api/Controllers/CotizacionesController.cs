using Aseguradora.Api.Security;
using Aseguradora.Application.Dtos;
using Aseguradora.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Aseguradora.Api.Controllers;

/// <summary>
/// Internal quotes of registered vehicles (CU09, RN05, RN06). Requires employee or administrator permissions.
/// </summary>
[ApiController]
[Route("api/cotizaciones")]
[Authorize(Policy = Politicas.Empleado)]
public sealed class CotizacionesController(ICotizacionService cotizaciones) : ControllerBase
{
    private readonly ICotizacionService _cotizaciones = cotizaciones ?? throw new ArgumentNullException(nameof(cotizaciones));

    /// <summary>
    /// Quotes a vehicle in every compatible plan and stores one quote per plan, valid for 15 days.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(CotizacionResultado), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CotizacionResultado>> Cotizar(CotizarVehiculoRequest request, CancellationToken ct)
    {
        var resultado = await _cotizaciones.CotizarVehiculoAsync(request.VehiculoId!.Value, ct);
        return StatusCode(StatusCodes.Status201Created, resultado);
    }

    /// <summary>Gets a stored quote by id.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(CotizacionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CotizacionDto>> Obtener(Guid id, CancellationToken ct) =>
        Ok(await _cotizaciones.ObtenerAsync(id, ct));
}
