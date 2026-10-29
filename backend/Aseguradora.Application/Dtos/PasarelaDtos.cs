namespace Aseguradora.Application.Dtos;
public record PasarelaPagador(string Nombre, string Dni, string Email);
public record PasarelaCrearPagoRequest(string ReferenciaExterna, decimal Importe, string Moneda, string Descripcion, PasarelaPagador Pagador, string UrlRetornoExito, string UrlRetornoError, string UrlNotificacion);
public record PasarelaCrearPagoResponse(string IdPago, string Estado, string UrlPago, DateTime FechaExpiracion);
public record PasarelaPagoResponse(string IdPago, string? ReferenciaExterna, string Estado, decimal Importe, DateTime Fecha, string? MedioPago);