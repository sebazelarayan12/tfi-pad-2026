using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;
using Aseguradora.Application.Dtos;
using Aseguradora.Application.External;
using Aseguradora.Application.Exceptions;
namespace Aseguradora.Integrations.Arca;
public sealed class ArcaMockService : IArcaService
{
    private readonly ConcurrentDictionary<string, ArcaFacturaResponse> facturas = new();
    private long secuencia;
    public Task<ArcaFacturaResponse> EmitirFacturaAsync(ArcaFacturaRequest request, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        if (request.ImporteNeto + request.ImporteIva != request.ImporteTotal)
            throw new ArgumentException("El neto más IVA debe coincidir con el total.");
        return Task.FromResult(facturas.GetOrAdd(request.ReferenciaExterna, referencia => {
            var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(referencia)));
            var cae = (Convert.ToUInt64(hash[..16], 16) % 100000000000000UL).ToString("D14");
            return new($"{request.PuntoVenta:D4}-{Interlocked.Increment(ref secuencia):D8}", cae, request.FechaEmision.AddDays(10), "APROBADA", null);
        }));
    }
    public Task<ArcaFacturaResponse> ConsultarFacturaAsync(string numeroComprobante, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        return Task.FromResult(facturas.Values.FirstOrDefault(f => f.NumeroComprobante == numeroComprobante)
            ?? throw new NotFoundException("Factura inexistente."));
    }
}