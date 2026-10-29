using Aseguradora.Application.Exceptions;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace Aseguradora.Application.Services;

/// <summary>Único camino de aprobación compartido por caja, pasarelas y rendiciones.</summary>
public sealed class AprobacionPagoService(
    IRepository<Cuota> cuotas, IRepository<Poliza> polizas, IUnitOfWork unitOfWork,
    IActualizadorEstadoPoliza actualizador, IFacturacionService facturacion,
    ILogger<AprobacionPagoService> logger, IRepository<Factura> facturas) : IAprobacionPagoService
{
    private readonly IRepository<Cuota> _cuotas = cuotas ?? throw new ArgumentNullException(nameof(cuotas));
    private readonly IRepository<Poliza> _polizas = polizas ?? throw new ArgumentNullException(nameof(polizas));
    private readonly IUnitOfWork _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    private readonly IActualizadorEstadoPoliza _actualizador = actualizador ?? throw new ArgumentNullException(nameof(actualizador));
    private readonly IFacturacionService _facturacion = facturacion ?? throw new ArgumentNullException(nameof(facturacion));
    private readonly ILogger<AprobacionPagoService> _logger = logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly IRepository<Factura> _facturas = facturas ?? throw new ArgumentNullException(nameof(facturas));

    /// <inheritdoc />
    public async Task<Pago> AprobarAsync(Pago pago, DateTime fechaAcreditacion, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(pago);
        if (pago.Estado == EstadoPago.Aprobado)
        {
            if (pago.RequiereRevisionPorDuplicado || await _facturas.AnyAsync(f => f.PagoId == pago.Id, ct))
                return pago;
            var ids = _cuotas.Query().Where(c => c.PagoCuotas.Any(d => d.PagoId == pago.Id))
                .Select(c => c.PolizaId).Distinct().ToList();
            foreach (var id in ids) await _actualizador.ReevaluarAsync(id, ct);
            await _unitOfWork.SaveChangesAsync(ct);
            await _facturacion.EmitirAsync(pago.Id, ct);
            return pago;
        }
        if (pago.PagoCuotas.Count == 0) throw new BusinessRuleException("El pago no contiene cuotas.");
        var seleccion = new List<Cuota>();
        foreach (var detalle in pago.PagoCuotas)
        {
            var cuota = await _cuotas.GetByIdAsync(detalle.CuotaId, ct)
                ?? throw new NotFoundException($"Cuota inexistente: {detalle.CuotaId}.");
            var poliza = await _polizas.GetByIdAsync(cuota.PolizaId, ct)
                ?? throw new NotFoundException($"Póliza inexistente: {cuota.PolizaId}.");
            if (poliza.ClienteId != pago.ClienteId)
                throw new BusinessRuleException("Todas las cuotas deben pertenecer al cliente del pago.");
            seleccion.Add(cuota);
        }
        if (seleccion.Select(c => c.Id).Distinct().Count() != seleccion.Count)
            throw new BusinessRuleException("El pago contiene cuotas repetidas.");
        if (seleccion.Any(c => c.Estado == EstadoCuota.Anulada))
            throw new BusinessRuleException("No se pueden cobrar cuotas anuladas.");
        pago.ImporteTotal = pago.PagoCuotas.Sum(c => c.Importe);
        pago.Aprobar(fechaAcreditacion);
        if (seleccion.Any(c => c.Estado == EstadoCuota.Pagada))
        {
            pago.RequiereRevisionPorDuplicado = true;
            await _unitOfWork.SaveChangesAsync(ct);
            _logger.LogError("PAGO_DUPLICADO_REQUIERE_REVISION PagoId={PagoId}", pago.Id);
            return pago;
        }
        foreach (var cuota in seleccion) cuota.Pagar(pago.FechaAcreditacion!.Value);
        await _unitOfWork.SaveChangesAsync(ct);
        foreach (var polizaId in seleccion.Select(c => c.PolizaId).Distinct())
            await _actualizador.ReevaluarAsync(polizaId, ct);
        await _unitOfWork.SaveChangesAsync(ct);
        await _facturacion.EmitirAsync(pago.Id, ct);
        return pago;
    }
}
