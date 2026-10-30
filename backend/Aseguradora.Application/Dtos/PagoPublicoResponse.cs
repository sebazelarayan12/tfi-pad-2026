namespace Aseguradora.Application.Dtos;

/// <summary>Pago online iniciado: el cliente abre <paramref name="UrlPago"/> para pagar en la pasarela.</summary>
/// <param name="NumeroPago">Número propio del pago (<c>PAG-xxxxxx</c>); sirve para pedir la factura (CU18).</param>
/// <param name="IdPago">Identificador del pago en este sistema.</param>
/// <param name="UrlPago">Link de checkout de la pasarela.</param>
/// <param name="FechaExpiracion">Momento (UTC) en que vence el link de pago.</param>
public sealed record PagoPublicoResponse(
    string NumeroPago,
    Guid IdPago,
    string UrlPago,
    DateTime FechaExpiracion);
