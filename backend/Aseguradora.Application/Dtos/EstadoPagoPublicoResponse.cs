namespace Aseguradora.Application.Dtos;

/// <summary>Estado público de un pago (PB-01).</summary>
/// <param name="NumeroPago">Número de pago (<c>PAG-xxxxxx</c>).</param>
/// <param name="Estado"><c>PENDIENTE</c>, <c>APROBADO</c> o <c>RECHAZADO</c>.</param>
/// <param name="FechaAcreditacion">Fecha UTC de acreditación; solo con el pago aprobado.</param>
/// <param name="UrlPago">Link para completar el pago; solo si sigue pendiente y dentro de la reserva.</param>
/// <param name="Factura">Factura del pago, si ya se emitió.</param>
public sealed record EstadoPagoPublicoResponse(
    string NumeroPago,
    string Estado,
    DateTime? FechaAcreditacion,
    string? UrlPago,
    FacturaResponse? Factura);
