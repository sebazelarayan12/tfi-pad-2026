using Aseguradora.Application.Dtos;
using Aseguradora.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace Aseguradora.Api.Controllers;

/// <summary>
/// Pagos de la web pública (CU15). Hereda la ruta <c>api/publico</c> y, como el resto del prefijo, queda
/// limitada por el rate limit global de RN20 sin atributo propio (C15).
/// </summary>
public sealed class PublicoPagosController(IPagoService pagos) : PublicoController
{
    /// <summary>Inicia un pago online con la pasarela elegida y devuelve el link de pago.</summary>
    [HttpPost("pagos")]
    [ProducesResponseType(typeof(PagoPublicoResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status429TooManyRequests)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status502BadGateway)]
    public async Task<ActionResult<PagoPublicoResponse>> Iniciar(PagoPublicoRequest request, CancellationToken ct) =>
        StatusCode(StatusCodes.Status201Created, await pagos.IniciarPagoOnlineAsync(request, ct));
}
