namespace Aseguradora.Application.Dtos;

/// <summary>Factura autorizada o pendiente de CAE; no expone datos personales del titular.</summary>
public sealed record FacturaResponse(
    Guid Id, Guid PagoId, string Numero, char Tipo, decimal Importe,
    string Estado, string? Cae, DateOnly? VencimientoCae, DateTime FechaEmision);
