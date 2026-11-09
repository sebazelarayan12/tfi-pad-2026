using Aseguradora.Application.Dtos;
namespace Aseguradora.Application.External;
/// <summary>Contrato con ARCA para emitir y consultar facturas.</summary>
public interface IArcaService
{
    /// <summary>Autoriza una factura idempotente y valida que neto más IVA coincida con el total.</summary>
    Task<ArcaFacturaResponse> EmitirFacturaAsync(ArcaFacturaRequest request, CancellationToken ct);
    /// <summary>Consulta una factura autorizada por su número de comprobante.</summary>
    Task<ArcaFacturaResponse> ConsultarFacturaAsync(string numeroComprobante, CancellationToken ct);
    /// <summary>PDF de una factura ya autorizada, identificada por su número de comprobante ("0001-00000003") y su letra.</summary>
    Task<byte[]> ObtenerPdfAsync(string numeroComprobante, char tipo, CancellationToken ct);
}
