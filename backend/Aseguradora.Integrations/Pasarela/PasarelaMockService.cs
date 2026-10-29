using System.Collections.Concurrent;
using Aseguradora.Application.Dtos;
using Aseguradora.Application.External;
using Aseguradora.Application.Exceptions;
namespace Aseguradora.Integrations.Pasarela;
/// <summary>Define PasarelaMockService para la integración de pagos y facturación.</summary>
public sealed class PasarelaMockService : IPasarelaService
{
    private readonly string proveedor;
    private readonly TimeProvider timeProvider;

    /// <summary>Crea un proveedor de prueba con un reloj inyectable.</summary>
    public PasarelaMockService(string proveedor, TimeProvider timeProvider)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(proveedor);
        ArgumentNullException.ThrowIfNull(timeProvider);
        this.proveedor = proveedor;
        this.timeProvider = timeProvider;
    }

    private readonly ConcurrentDictionary<string, (PasarelaCrearPagoResponse Creacion, PasarelaPagoResponse Pago)> pagos = new();
    /// <summary>Crea un checkout pendiente para la referencia externa indicada.</summary>
    public Task<PasarelaCrearPagoResponse> CrearPagoAsync(PasarelaCrearPagoRequest request, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(request);
        ct.ThrowIfCancellationRequested();
        var id = "PSR-" + request.ReferenciaExterna;
        var pago = pagos.GetOrAdd(id, _ => {
            var fecha = timeProvider.GetUtcNow().UtcDateTime;
            return (new(id, "PENDIENTE", $"https://{proveedor}.example/checkout/{Uri.EscapeDataString(id)}", fecha.AddHours(1)),
                new(id, request.ReferenciaExterna, "PENDIENTE", request.Importe, fecha, null));
        });
        return Task.FromResult(pago.Creacion);
    }
    /// <summary>Consulta el estado almacenado de un pago.</summary>
    public Task<PasarelaPagoResponse> ConsultarPagoAsync(string idPago, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        return Task.FromResult(pagos.TryGetValue(idPago, out var pago) ? pago.Pago : throw new NotFoundException("Pago inexistente."));
    }
}
