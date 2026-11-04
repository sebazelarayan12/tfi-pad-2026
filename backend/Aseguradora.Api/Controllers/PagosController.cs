using Aseguradora.Api.Security;
using Aseguradora.Application.Dtos;
using Aseguradora.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Aseguradora.Api.Controllers;

/// <summary>Cobro en caja y consulta de pagos y facturas (CU17, CU18, RN17).</summary>
[ApiController]
[Route("api/pagos")]
[Authorize(Policy = Politicas.Empleado)]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
[ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
public sealed class PagosController(IPagoService pagos) : ControllerBase
{
    /// <summary>Consulta a la pasarela y aplica el resultado de un pago cuyo aviso no llegó.</summary>
    [HttpPost("{id:guid}/conciliar")]
    [ProducesResponseType(typeof(PagoResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status502BadGateway)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<PagoResponse>> Conciliar(Guid id, CancellationToken ct) =>
        Ok(await pagos.ConciliarAsync(id, ct));

    /// <summary>Cobra las cuotas seleccionadas y emite su factura.</summary>
    [HttpPost("caja")]
    [ProducesResponseType(typeof(PagoResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PagoResponse>> RegistrarCaja(PagoCajaRequest request, CancellationToken ct)
    {
        var pago = await pagos.RegistrarCajaAsync(request, ct);
        return CreatedAtAction(nameof(Obtener), new { id = pago.Id }, pago);
    }

    /// <summary>Consulta el estado de un pago y su factura, si existe.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(PagoResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagoResponse>> Obtener(Guid id, CancellationToken ct) =>
        Ok(await pagos.ObtenerPagoAsync(id, ct));

    /// <summary>Consulta la factura, incluida la que aún espera su CAE.</summary>
    [HttpGet("{id:guid}/factura")]
    [ProducesResponseType(typeof(FacturaResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<FacturaResponse>> ObtenerFactura(Guid id, CancellationToken ct) =>
        Ok(await pagos.ObtenerFacturaAsync(id, ct));
}
