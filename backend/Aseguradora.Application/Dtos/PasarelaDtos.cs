namespace Aseguradora.Application.Dtos;
/// <summary>Datos del pagador que se informan a la pasarela.</summary>
public record PasarelaPagador(
    string Nombre,
    string Dni,
    string Email);
/// <summary>Solicitud de creación de un pago en la pasarela, con importe y URLs de retorno y notificación (contrato 9.3).</summary>
public record PasarelaCrearPagoRequest(
    string ReferenciaExterna,
    decimal Importe,
    string Moneda,
    string Descripcion,
    PasarelaPagador Pagador,
    string UrlRetornoExito,
    string UrlRetornoError,
    string UrlNotificacion);
/// <summary>Pago creado en la pasarela, con la URL de checkout y su fecha de expiración.</summary>
public record PasarelaCrearPagoResponse(
    string IdPago,
    string Estado,
    string UrlPago,
    DateTime FechaExpiracion);
/// <summary>Estado de un pago consultado en la pasarela.</summary>
public record PasarelaPagoResponse(
    string IdPago,
    string? ReferenciaExterna,
    string Estado,
    decimal Importe,
    DateTime Fecha,
    string? MedioPago);
