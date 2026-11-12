using Aseguradora.Application.Services;
using Aseguradora.Integrations.Padi;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Aseguradora.Api.Controllers;

/// <summary>
/// Avisos de PADI (pasarela1). PADI no manda API key: autentica con la firma HMAC-SHA256 del cuerpo crudo
/// en <c>X-Padi-Signature</c>. El aviso se traduce al formato común y lo aplica <see cref="WebhookPagoService"/>,
/// que con <c>ConfirmarWebhook</c> vuelve a consultar el link en PADI antes de aprobar.
/// </summary>
[ApiController]
[Route("api/webhooks/padi")]
[AllowAnonymous]
public sealed class PadiWebhooksController(PadiWebhookReceptor receptor, WebhookPagoService servicio) : ControllerBase
{
    /// <summary>Tamaño máximo aceptado para el cuerpo de un aviso.</summary>
    public const int TamanoMaximoCuerpo = 64 * 1024;

    /// <summary>Valida la firma del aviso y aplica una vez el pago exitoso que informa PADI.</summary>
    [HttpPost]
    [RequestSizeLimit(TamanoMaximoCuerpo)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> Recibir(CancellationToken ct)
    {
        if (!receptor.Activo)
            return NotFound();

        // The signature covers the exact bytes PADI sent, so the body is read raw instead of model-bound.
        using var cuerpo = new MemoryStream();
        await Request.Body.CopyToAsync(cuerpo, ct);

        var resultado = receptor.Interpretar(cuerpo.GetBuffer().AsSpan(0, (int)cuerpo.Length),
            Request.Headers[PadiWebhookReceptor.HeaderFirma].ToString());
        switch (resultado.Tipo)
        {
            case TipoResultadoWebhookPadi.FirmaInvalida:
                return Unauthorized();
            case TipoResultadoWebhookPadi.CuerpoInvalido:
                return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Aviso de PADI inválido.");
            case TipoResultadoWebhookPadi.Pago:
                await servicio.ProcesarAsync(PadiWebhookReceptor.Proveedor, resultado.Aviso!, ct);
                break;
        }

        return Ok(new { recibido = true });
    }
}
