using Aseguradora.Api.Security;
using Aseguradora.Application.Dtos.Externo;
using Aseguradora.Application.Services;
using Aseguradora.Application.Tiempo;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Aseguradora.Api.Controllers;

/// <summary>
/// Insurance check for external systems with an API key (CU19). Its own controller so it does not
/// collide with the external endpoints of Frente 2 and Frente 4 (C7).
/// </summary>
[ApiController]
[Route("api/externo")]
[Authorize(Policy = Politicas.ApiKey)]
public sealed class ExternoSeguroController(ISeguroVigenteService seguros, TimeProvider reloj) : ControllerBase
{
    /// <summary>Whether the vehicle has a Vigente policy today. Never 404 for a missing policy.</summary>
    [HttpGet("vehiculos/{patente}/seguro-vigente")]
    [ProducesResponseType(typeof(SeguroVigenteResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<SeguroVigenteResponse>> SeguroVigente(string patente, CancellationToken ct) =>
        Ok(await seguros.ConsultarAsync(patente, FechaArgentina.Hoy(reloj), ct));
}
