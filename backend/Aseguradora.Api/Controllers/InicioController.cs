using Aseguradora.Api.Security;
using Aseguradora.Application.Dtos;
using Aseguradora.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Aseguradora.Api.Controllers;

/// <summary>
/// Backoffice home page summary (PB-08). Requires employee or administrator permissions.
/// </summary>
[ApiController]
[Route("api/inicio")]
[Authorize(Policy = Politicas.Empleado)]
public sealed class InicioController(IResumenInicioService resumen) : ControllerBase
{
    /// <summary>Policies per state, overdue installments, settlement and invoice flags, as of today in Argentina.</summary>
    [HttpGet("resumen")]
    [ProducesResponseType(typeof(ResumenInicioResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ResumenInicioResponse>> Resumen(CancellationToken ct) =>
        Ok(await resumen.ObtenerAsync(ct));
}
