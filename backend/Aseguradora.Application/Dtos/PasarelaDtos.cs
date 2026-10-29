namespace Aseguradora.Application.Dtos;
/// <summary>Define PasarelaPagador para la integración de pagos y facturación.</summary>
public record PasarelaPagador(
    string Nombre,
    string Dni,
    string Email);
/// <summary>Define PasarelaCrearPagoRequest para la integración de pagos y facturación.</summary>
public record PasarelaCrearPagoRequest(
    string ReferenciaExterna,
    decimal Importe,
    string Moneda,
    string Descripcion,
    PasarelaPagador Pagador,
    string UrlRetornoExito,
    string UrlRetornoError,
    string UrlNotificacion);
/// <summary>Define PasarelaCrearPagoResponse para la integración de pagos y facturación.</summary>
public record PasarelaCrearPagoResponse(
    string IdPago,
    string Estado,
    string UrlPago,
    DateTime FechaExpiracion);
/// <summary>Define PasarelaPagoResponse para la integración de pagos y facturación.</summary>
public record PasarelaPagoResponse(
    string IdPago,
    string? ReferenciaExterna,
    string Estado,
    decimal Importe,
    DateTime Fecha,
    string? MedioPago);
