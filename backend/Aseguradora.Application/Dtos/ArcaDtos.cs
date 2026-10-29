namespace Aseguradora.Application.Dtos;
public record ArcaReceptor(string TipoDocumento, string NumeroDocumento, string Nombre, string CondicionIva);
public record ArcaItem(string Descripcion, decimal Cantidad, decimal PrecioUnitario);
public record ArcaFacturaRequest(string CuitEmisor, int PuntoVenta, string TipoComprobante, string Concepto, DateOnly FechaEmision, ArcaReceptor Receptor, IReadOnlyList<ArcaItem> Items, decimal ImporteNeto, decimal ImporteIva, decimal ImporteTotal, string ReferenciaExterna);
public record ArcaFacturaResponse(string NumeroComprobante, string Cae, DateOnly VencimientoCae, string Estado, string? UrlPdf);