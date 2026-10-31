using Aseguradora.Application.Dtos;
using Aseguradora.Application.Exceptions;
using Aseguradora.Application.External;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace Aseguradora.Application.Services;

/// <summary>Procesa resultados de pasarelas una sola vez y publica el núcleo para conciliación.</summary>
public sealed class WebhookPagoService(
    IRepository<Pago> pagos, IRepository<Cuota> cuotas, IRepository<Poliza> polizas,
    IUnitOfWork unitOfWork, IAprobacionPagoService aprobacion, IPasarelaResolver pasarelas,
    IExclusionWebhook exclusion, Func<string, bool> confirmarWebhook,
    TimeProvider reloj, ILogger<WebhookPagoService> logger, IRecargadorPago recargador)
{
    /// <summary>Valida el proveedor, resuelve el pago y procesa el resultado recibido.</summary>
    public async Task ProcesarAsync(string proveedor, PasarelaWebhookRequest request, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        ExigirProveedor(proveedor);
        ExigirResultado(request.Estado, request.Importe);
        if (request.IdCuotas?.Count > PasarelaWebhookRequest.MaximoCuotas)
            throw new BusinessRuleException("No se permiten más de 50 cuotas por aviso.");
        if (string.IsNullOrWhiteSpace(request.IdPago) || request.IdPago.Length > 100 || request.Fecha == default)
            throw new BusinessRuleException("El identificador y la fecha del pago son obligatorios.");
        await using var bloqueo = await exclusion.AdquirirAsync(request.IdPago, ct);
        var pago = (await pagos.FindAsync(p => p.IdExterno == request.IdPago && p.Proveedor == proveedor, ct)).SingleOrDefault();
        if (pago is not null && pago.Estado != EstadoPago.Pendiente) return;

        if (confirmarWebhook(proveedor))
        {
            var confirmado = await pasarelas.Obtener(proveedor).ConsultarPagoAsync(request.IdPago, ct);
            var importeDistinto = request.Estado == ValoresPagoResponse.Aprobado && confirmado.Importe != request.Importe;
            if (confirmado.IdPago != request.IdPago || confirmado.Estado != request.Estado
                || importeDistinto
                || (request.ReferenciaExterna is not null && confirmado.ReferenciaExterna != request.ReferenciaExterna))
            {
                if (importeDistinto)
                    logger.LogError("PAGO_IMPORTE_NO_COINCIDE IdPago={IdPago} Esperado={Esperado} Recibido={Recibido}",
                        request.IdPago, confirmado.Importe, request.Importe);
                else
                    logger.LogError("PAGO_CONFIRMACION_NO_COINCIDE Proveedor={Proveedor} IdPago={IdPago}", proveedor, request.IdPago);
                return;
            }
        }

        if (pago is null && !string.IsNullOrWhiteSpace(request.ReferenciaExterna))
        {
            pago = (await pagos.FindAsync(p => p.Numero == request.ReferenciaExterna && p.Proveedor == proveedor, ct)).SingleOrDefault()
                ?? throw new NotFoundException("El pago no existe.");
            if (pago.IdExterno is not null && pago.IdExterno != request.IdPago)
                throw new BusinessRuleException("La referencia ya corresponde a otro pago externo.");
            if (pago.Estado != EstadoPago.Pendiente) return;
            pago.IdExterno = request.IdPago;
        }
        if (pago is null)
        {
            if (await pagos.AnyAsync(p => p.IdExterno == request.IdPago, ct))
                throw new BusinessRuleException("El identificador externo corresponde a otro proveedor.");
            pago = await CrearDesdeCuotasAsync(proveedor, request, ct);
            await pagos.AddAsync(pago, ct);
        }
        await AplicarInternoAsync(pago, request.Estado, request.Importe, request.Fecha.UtcDateTime, ct);
    }

    /// <summary>Aplica el resultado confirmado; reutilizable por la conciliación de US-F4-06.</summary>
    public async Task AplicarResultadoAsync(Pago pago, string estadoExterno, decimal importeExterno,
        CancellationToken ct = default, DateTimeOffset? fechaAcreditacion = null)
    {
        ArgumentNullException.ThrowIfNull(pago);
        await using var bloqueo = await exclusion.AdquirirAsync(pago.IdExterno ?? pago.Numero, ct);
        await recargador.RecargarAsync(pago, ct);
        // La conciliación también consulta checkouts aún no resueltos (US-F4-06).
        if (estadoExterno == ValoresPagoResponse.Pendiente) return;
        await AplicarInternoAsync(pago, estadoExterno, importeExterno,
            fechaAcreditacion?.UtcDateTime ?? reloj.GetUtcNow().UtcDateTime, ct);
    }

    private async Task AplicarInternoAsync(Pago pago, string estado, decimal importe, DateTime fecha, CancellationToken ct)
    {
        ExigirResultado(estado, importe);
        if (pago.Estado != EstadoPago.Pendiente) return;
        if (estado is "RECHAZADO" or "CANCELADO")
        {
            pago.Rechazar();
            await unitOfWork.SaveChangesAsync(ct);
            return;
        }
        if (pago.ImporteTotal != importe)
        {
            logger.LogError("PAGO_IMPORTE_NO_COINCIDE PagoId={PagoId} Esperado={Esperado} Recibido={Recibido}",
                pago.Id, pago.ImporteTotal, importe);
            // Persiste el pago pendiente del caso 9.5 B para permitir su revisión posterior.
            await unitOfWork.SaveChangesAsync(ct);
            return;
        }
        if (pago.PagoCuotas.Count == 0)
            pago.PagoCuotas = pagos.Query().Where(p => p.Id == pago.Id).SelectMany(p => p.PagoCuotas).ToList();
        await aprobacion.AprobarAsync(pago, fecha, ct);
    }

    private async Task<Pago> CrearDesdeCuotasAsync(string proveedor, PasarelaWebhookRequest request, CancellationToken ct)
    {
        var ids = request.IdCuotas?.ToList();
        if (ids is null || ids.Count == 0) throw new NotFoundException("El pago no existe.");
        if (ids.Distinct().Count() != ids.Count) throw new BusinessRuleException("Las cuotas no pueden repetirse.");
        var seleccion = await cuotas.FindAsync(c => ids.Contains(c.Id), ct);
        if (seleccion.Count != ids.Count) throw new NotFoundException("Alguna cuota no existe.");
        if (seleccion.Any(c => c.Estado is not (EstadoCuota.Pendiente or EstadoCuota.Vencida)))
            throw new BusinessRuleException("Solo se pueden pagar cuotas pendientes o vencidas.");
        var polizaIds = seleccion.Select(c => c.PolizaId).Distinct().ToList();
        var titulares = await polizas.FindAsync(p => polizaIds.Contains(p.Id), ct);
        var clientes = titulares.Select(p => p.ClienteId).Distinct().ToList();
        if (titulares.Count != polizaIds.Count || clientes.Count != 1)
            throw new BusinessRuleException("Todas las cuotas deben pertenecer al mismo cliente.");
        string? numero = null;
        for (var intento = 0; intento < 5; intento++)
        {
            var candidato = $"PAG-{Guid.NewGuid():N}"[..10];
            if (!await pagos.AnyAsync(p => p.Numero == candidato, ct)) { numero = candidato; break; }
        }
        var pago = Pago.CrearPendiente(clientes[0], numero ?? throw new InvalidOperationException("No se pudo generar número de pago."),
            MedioPago.Pasarela, seleccion, reloj.GetUtcNow().UtcDateTime, proveedor);
        pago.IdExterno = request.IdPago;
        return pago;
    }

    /// <summary>Rechaza proveedores que no corresponden al contrato publicado.</summary>
    public static void ExigirProveedor(string proveedor)
    {
        if (!PagoService.ProveedoresValidos.Contains(proveedor)) throw new NotFoundException("El proveedor no existe.");
    }

    private static void ExigirResultado(string estado, decimal importe)
    {
        if (estado is not ("APROBADO" or "RECHAZADO" or "CANCELADO") || importe <= 0)
            throw new BusinessRuleException("El estado o importe del pago no es válido.");
    }
}
