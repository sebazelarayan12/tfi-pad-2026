namespace Aseguradora.Application.Dtos;
/// <summary>Datos del receptor de la factura: documento, nombre y condición frente al IVA.</summary>
public record ArcaReceptor(
    string TipoDocumento,
    string NumeroDocumento,
    string Nombre,
    string CondicionIva);
/// <summary>Línea de detalle de la factura.</summary>
public record ArcaItem(
    string Descripcion,
    decimal Cantidad,
    decimal PrecioUnitario);
/// <summary>Solicitud de emisión de factura a ARCA (contrato 9.2).</summary>
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
/// <summary>Factura autorizada por ARCA con su número de comprobante, CAE y vencimiento del CAE.</summary>
public record ArcaFacturaResponse(
    string NumeroComprobante,
    string Cae,
    DateOnly VencimientoCae,
    string Estado,
    string? UrlPdf);
