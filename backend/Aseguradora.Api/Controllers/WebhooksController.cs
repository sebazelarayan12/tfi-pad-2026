using Aseguradora.Api.Security;
using Aseguradora.Application.Dtos;
using Aseguradora.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Aseguradora.Api.Controllers;

/// <summary>Avisos de pasarelas autenticados por API key (CU16, RN12, RN17).</summary>
[ApiController]
[Route("api/webhooks")]
[Authorize(Policy = Politicas.ApiKey)]
public sealed class WebhooksController(WebhookPagoService servicio) : ControllerBase
{
    /// <summary>Aplica una vez el resultado del pago de la pasarela autenticada.</summary>
    [HttpPost("pasarela/{proveedor}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> Recibir(string proveedor, PasarelaWebhookRequest request, CancellationToken ct)
    {
        WebhookPagoService.ExigirProveedor(proveedor);
        if (!string.Equals(User.FindFirst(ClaimsAseguradora.Proveedor)?.Value, proveedor, StringComparison.Ordinal))
            return Unauthorized();
        await servicio.ProcesarAsync(proveedor, request, ct);
        return Ok(new { recibido = true });
    }
}
