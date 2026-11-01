using Aseguradora.Api.Security;
using Aseguradora.Application.Dtos.PagoFacil;
using Aseguradora.Application.PagoFacil;
using Aseguradora.Application.Tiempo;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Aseguradora.Api.Controllers;

/// <summary>
/// Pago Fácil for employees: coupon (CU20) and settlement files (CU21). US-F3-08 adds its action here.
/// </summary>
[ApiController]
[Route("api/pagofacil")]
[Authorize(Policy = Politicas.Empleado)]
public sealed class PagoFacilController(
    ICuponPagoFacilService cupones, IRendicionService rendiciones, TimeProvider reloj) : ControllerBase
{
    /// <summary>Builds the coupon of a Pendiente or Vencida installment, with its 42-digit barcode.</summary>
    [HttpGet("cuotas/{cuotaId:guid}/cupon")]
    [ProducesResponseType(typeof(CuponPagoFacilResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<CuponPagoFacilResponse>> Cupon(Guid cuotaId, CancellationToken ct) =>
        Ok(await cupones.GenerarAsync(cuotaId, FechaArgentina.Hoy(reloj), ct));

    /// <summary>
    /// Processes a settlement file (multipart field <c>archivo</c>). Each valid line creates and approves
    /// a payment; lines with errors are reported. A file name is processed only once (RN18).
    /// </summary>
    [HttpPost("rendiciones")]
    [Consumes("multipart/form-data")]
    [RequestFormLimits(MultipartBodyLengthLimit = LimiteFormulario)]
    [RequestSizeLimit(LimiteFormulario)]
    [ProducesResponseType(typeof(RendicionResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<RendicionResponse>> ProcesarRendicion(IFormFile archivo, CancellationToken ct)
    {
        await using var contenido = archivo.OpenReadStream();
        var resultado = await rendiciones.ProcesarAsync(archivo.FileName, contenido, ct);
        return StatusCode(StatusCodes.Status201Created, resultado);
    }

    /// <summary>Processed settlement files, newest first (CU21).</summary>
    [HttpGet("rendiciones")]
    [ProducesResponseType(typeof(IReadOnlyList<HistorialRendicionResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<IReadOnlyList<HistorialRendicionResponse>>> HistorialRendiciones(CancellationToken ct) =>
        Ok(await rendiciones.ListarAsync(ct));

    // Room above the 5 MB file limit for the multipart envelope, so a larger file still reaches the
    // service and gets its 400 instead of the server's 413.
    private const long LimiteFormulario = 2L * RendicionService.TamanoMaximoBytes;
}
