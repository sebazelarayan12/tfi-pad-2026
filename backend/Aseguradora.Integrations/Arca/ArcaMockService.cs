using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;
using Aseguradora.Application.Dtos;
using Aseguradora.Application.External;
using Aseguradora.Application.Exceptions;
namespace Aseguradora.Integrations.Arca;
/// <summary>Define ArcaMockService para la integración de pagos y facturación.</summary>
public sealed class ArcaMockService : IArcaService
{
    private readonly ConcurrentDictionary<string, ArcaFacturaResponse> facturas = new();
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
        return Task.FromResult(facturas.GetOrAdd(request.ReferenciaExterna, referencia => {
            var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(referencia)));
            var cae = (Convert.ToUInt64(hash[..16], 16) % 100000000000000UL).ToString("D14");
            return new($"{request.PuntoVenta:D4}-{++secuencia:D8}", cae, request.FechaEmision.AddDays(10), "APROBADA", null);
        }));
        }
    }
    /// <summary>Consulta una factura autorizada por su número de comprobante.</summary>
    public Task<ArcaFacturaResponse> ConsultarFacturaAsync(string numeroComprobante, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        return Task.FromResult(facturas.Values.FirstOrDefault(f => f.NumeroComprobante == numeroComprobante)
            ?? throw new NotFoundException("Factura inexistente."));
    }
}
