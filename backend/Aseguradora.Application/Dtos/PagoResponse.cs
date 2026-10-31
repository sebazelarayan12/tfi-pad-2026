namespace Aseguradora.Application.Dtos;

/// <summary>Estado de un pago y su comprobante fiscal, cuando existe.</summary>
public sealed record PagoResponse(
    Guid Id, Guid ClienteId, string Numero, string Estado, string Medio, decimal Importe,
    DateTime FechaCreacion, DateTime? FechaAcreditacion, FacturaResponse? Factura);
