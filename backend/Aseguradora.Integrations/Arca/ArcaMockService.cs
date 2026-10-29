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
