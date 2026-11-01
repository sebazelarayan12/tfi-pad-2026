using System.Text;
using Aseguradora.Api.Security;
using Aseguradora.Application.Dtos.PagoFacil;
using Aseguradora.Application.PagoFacil;
using Aseguradora.Application.Tiempo;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Aseguradora.Api.Controllers;

/// <summary>
/// Pago Fácil for employees (CU20). US-F3-07 and US-F3-08 add their actions to this controller.
/// </summary>
[ApiController]
[Route("api/pagofacil")]
[Authorize(Policy = Politicas.Empleado)]
public sealed class PagoFacilController(
    ICuponPagoFacilService cupones, IBasePositivaService basePositiva, TimeProvider reloj) : ControllerBase
{
    private const string TipoTextoPlano = "text/plain";

    /// <summary>Builds the coupon of a Pendiente or Vencida installment, with its 42-digit barcode.</summary>
    [HttpGet("cuotas/{cuotaId:guid}/cupon")]
    [ProducesResponseType(typeof(CuponPagoFacilResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<CuponPagoFacilResponse>> Cupon(Guid cuotaId, CancellationToken ct) =>
        Ok(await cupones.GenerarAsync(cuotaId, FechaArgentina.Hoy(reloj), ct));

    /// <summary>
    /// Downloads the positive base (CU22): every debt still payable, as a fixed-width text file that is
    /// handed to Pago Fácil by hand.
    /// </summary>
    [HttpGet("base-positiva")]
    [Produces(TipoTextoPlano)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> BasePositiva(CancellationToken ct)
    {
        var archivo = await basePositiva.GenerarAsync(FechaArgentina.Hoy(reloj), ct);
        return File(Encoding.ASCII.GetBytes(archivo.Contenido), TipoTextoPlano, archivo.NombreArchivo);
    }
}
