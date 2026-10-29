using System.Collections.Concurrent;
using Aseguradora.Application.Dtos;
using Aseguradora.Application.External;
using Aseguradora.Application.Exceptions;
namespace Aseguradora.Integrations.Pasarela;
public sealed class PasarelaMockService(string proveedor) : IPasarelaService
{
    private readonly ConcurrentDictionary<string, (PasarelaCrearPagoResponse Creacion, PasarelaPagoResponse Pago)> pagos = new();
    public Task<PasarelaCrearPagoResponse> CrearPagoAsync(PasarelaCrearPagoRequest request, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        var id = "PSR-" + request.ReferenciaExterna;
        var pago = pagos.GetOrAdd(id, _ => {
            var fecha = DateTime.UtcNow;
            return (new(id, "PENDIENTE", $"https://{proveedor}.example/checkout/{Uri.EscapeDataString(id)}", fecha.AddHours(1)),
                new(id, request.ReferenciaExterna, "PENDIENTE", request.Importe, fecha, null));
        });
        return Task.FromResult(pago.Creacion);
    }
    public Task<PasarelaPagoResponse> ConsultarPagoAsync(string idPago, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        return Task.FromResult(pagos.TryGetValue(idPago, out var pago) ? pago.Pago : throw new NotFoundException("Pago inexistente."));
    }
}