using Aseguradora.Api.Externo;
using Aseguradora.Api.Security;
using Aseguradora.Application.Dtos;
using Aseguradora.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Aseguradora.Api.Controllers;

/// <summary>Quotes for external systems authenticated by API key (CU09, contract 9.5 C).</summary>
[ApiController]
[Route("api/externo/cotizaciones")]
[Authorize(Policy = Politicas.ApiKey)]
public sealed class ExternoCotizacionesController(ICotizacionExternaService cotizaciones) : ControllerBase
{
    /// <summary>Persists one quote per compatible plan without registering a client or vehicle.</summary>
    /// <param name="body">Vehicle and driver data (9.5 C).</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>Compatible plans, their quote identifiers and expiration date.</returns>
    [HttpPost]
    [ProducesResponseType(typeof(CotizacionResultado), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<CotizacionResultado>> Cotizar(CotizacionExternaBody body, CancellationToken ct) =>
        StatusCode(StatusCodes.Status201Created, await cotizaciones.CotizarExternoAsync(
            new CotizacionExternaRequest(body.TipoVehiculo!.Value, body.Anio!.Value,
                body.Uso!.Value, body.EdadConductor!.Value), ct));
}
