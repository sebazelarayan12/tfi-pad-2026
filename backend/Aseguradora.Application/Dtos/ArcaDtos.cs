namespace Aseguradora.Application.Dtos;
/// <summary>Define ArcaReceptor para la integración de pagos y facturación.</summary>
public record ArcaReceptor(
    string TipoDocumento,
    string NumeroDocumento,
    string Nombre,
    string CondicionIva);
/// <summary>Define ArcaItem para la integración de pagos y facturación.</summary>
public record ArcaItem(
    string Descripcion,
    decimal Cantidad,
    decimal PrecioUnitario);
/// <summary>Define ArcaFacturaRequest para la integración de pagos y facturación.</summary>
public record ArcaFacturaRequest(
    string CuitEmisor,
    int PuntoVenta,
    string TipoComprobante,
    string Concepto,
    DateOnly FechaEmision,
    ArcaReceptor Receptor,
    IReadOnlyList<ArcaItem> Items,
    decimal ImporteNeto,
    decimal ImporteIva,
    decimal ImporteTotal,
    string ReferenciaExterna);
/// <summary>Define ArcaFacturaResponse para la integración de pagos y facturación.</summary>
public record ArcaFacturaResponse(
    string NumeroComprobante,
    string Cae,
    DateOnly VencimientoCae,
    string Estado,
    string? UrlPdf);
