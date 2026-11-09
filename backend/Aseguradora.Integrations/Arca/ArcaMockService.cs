using System.Security.Cryptography;
using System.Text;
using Aseguradora.Application.Dtos;
using Aseguradora.Application.External;
using Aseguradora.Application.Exceptions;
namespace Aseguradora.Integrations.Arca;
/// <summary>Servicio ARCA en memoria: emite facturas de forma idempotente por referencia externa, con CAE determinista.</summary>
public sealed class ArcaMockService : IArcaService
{
    private readonly Dictionary<string, ArcaFacturaResponse> facturas = new();
    private long secuencia;
    private readonly object sincronizacion = new();
    /// <summary>Autoriza una factura idempotente y valida que neto más IVA coincida con el total.</summary>
    public Task<ArcaFacturaResponse> EmitirFacturaAsync(ArcaFacturaRequest request, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(request);
        ct.ThrowIfCancellationRequested();
        if (request.ImporteNeto + request.ImporteIva != request.ImporteTotal)
            throw new ArgumentException("El neto más IVA debe coincidir con el total.");
        lock (sincronizacion)
        {
            if (!facturas.TryGetValue(request.ReferenciaExterna, out var factura))
            {
                var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(request.ReferenciaExterna)));
                var cae = (Convert.ToUInt64(hash[..16], 16) % 100000000000000UL).ToString("D14");
                factura = new($"{request.PuntoVenta:D4}-{++secuencia:D8}", cae, request.FechaEmision.AddDays(10), "APROBADA", null);
                facturas[request.ReferenciaExterna] = factura;
            }
            return Task.FromResult(factura);
        }
    }
    /// <summary>PDF mínimo con el número de la factura, para poder probar el flujo sin el servicio real.</summary>
    public Task<byte[]> ObtenerPdfAsync(string numeroComprobante, char tipo, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        var texto = $"Factura {tipo} {numeroComprobante} (simulada)";
        var contenido = $"BT /F1 18 Tf 72 720 Td ({texto}) Tj ET";
        var pdf = "%PDF-1.4\n"
            + "1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
            + "2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
            + "3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n"
            + $"4 0 obj<</Length {contenido.Length}>>stream\n{contenido}\nendstream endobj\n"
            + "5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n"
            + "trailer<</Root 1 0 R/Size 6>>\n%%EOF";
        return Task.FromResult(Encoding.ASCII.GetBytes(pdf));
    }
    /// <summary>Consulta una factura autorizada por su número de comprobante.</summary>
    public Task<ArcaFacturaResponse> ConsultarFacturaAsync(string numeroComprobante, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        lock (sincronizacion)
        {
            return Task.FromResult(facturas.Values.FirstOrDefault(f => f.NumeroComprobante == numeroComprobante)
                ?? throw new NotFoundException("Factura inexistente."));
        }
    }
}
