using Microsoft.Extensions.Logging;
using Aseguradora.Application.Dtos;
using Aseguradora.Application.Exceptions;
using Aseguradora.Application.External;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Domain.Interfaces;

namespace Aseguradora.Application.Services;

/// <summary>Autoriza facturas con ARCA, conservando pendientes ante fallas externas.</summary>
public sealed class FacturacionService(
    IRepository<Pago> pagos, IRepository<Cuota> cuotas, IRepository<Poliza> polizas,
    IRepository<Cliente> clientes, IRepository<Factura> facturas, IUnitOfWork unitOfWork,
    IArcaService arca, FacturacionOpciones opciones, TimeProvider reloj, ILogger<FacturacionService> logger,
    IEmisorFacturaAislado? emisorAislado = null) : IFacturacionService
{
    private readonly IRepository<Pago> _pagos = pagos ?? throw new ArgumentNullException(nameof(pagos));
    private readonly IRepository<Cuota> _cuotas = cuotas ?? throw new ArgumentNullException(nameof(cuotas));
    private readonly IRepository<Poliza> _polizas = polizas ?? throw new ArgumentNullException(nameof(polizas));
    private readonly IRepository<Cliente> _clientes = clientes ?? throw new ArgumentNullException(nameof(clientes));
    private readonly IRepository<Factura> _facturas = facturas ?? throw new ArgumentNullException(nameof(facturas));
    private readonly IUnitOfWork _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    private readonly IArcaService _arca = arca ?? throw new ArgumentNullException(nameof(arca));
    private readonly FacturacionOpciones _opciones = opciones ?? throw new ArgumentNullException(nameof(opciones));
    private readonly TimeProvider _reloj = reloj ?? throw new ArgumentNullException(nameof(reloj));

    private readonly ILogger<FacturacionService> _logger = logger ?? throw new ArgumentNullException(nameof(logger));

    // IVA incluido del 21 %: decisión por defecto de C8 y ejemplo 9.2.
    private const decimal FactorIva = 1.21m;

    /// <inheritdoc />
    public async Task ReintentarPendientesAsync(CancellationToken ct = default)
    {
        var pendientes = await _facturas.FindAsync(f => f.Estado == EstadoFactura.PendienteCae, ct);
        foreach (var factura in pendientes)
        {
            ct.ThrowIfCancellationRequested();
            string? numero = null;
            try
            {
                numero = (await _pagos.GetByIdAsync(factura.PagoId, ct))?.Numero;
                _logger.LogInformation("FACTURA_REINTENTO FacturaId={FacturaId} NumeroPago={NumeroPago}", factura.Id, numero);
                if (emisorAislado is null) await EmitirAsync(factura.PagoId, ct);
                else await emisorAislado.EmitirAsync(factura.PagoId, ct);
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
            catch (Exception ex)
            {
                _logger.LogError(ex, "FACTURA_REINTENTO_ERROR FacturaId={FacturaId} NumeroPago={NumeroPago}", factura.Id, numero);
                // Abandonar este scope evita guardar cambios de una emisión fallida al procesar otra.
                // El job crea otro scope en la siguiente corrida y vuelve a cargar las pendientes.
                if (emisorAislado is null) throw;
            }
            if (await _facturas.AnyAsync(f => f.Id == factura.Id && f.Estado == EstadoFactura.PendienteCae, ct))
                _logger.LogWarning("FACTURA_SIGUE_PENDIENTE FacturaId={FacturaId} NumeroPago={NumeroPago}", factura.Id, numero);
        }
    }

    /// <inheritdoc />
    public async Task EmitirAsync(Guid pagoId, CancellationToken ct = default)
    {
        var pago = await _pagos.GetByIdAsync(pagoId, ct)
            ?? throw new NotFoundException("El pago no existe.");
        if (pago.RequiereRevisionPorDuplicado) return;
        if (pago.Estado != EstadoPago.Aprobado)
            throw new BusinessRuleException("Solo se facturan pagos aprobados.");
        var existentes = await _facturas.FindAsync(f => f.PagoId == pagoId, ct);
        var factura = existentes.SingleOrDefault();
        if (factura?.Estado == EstadoFactura.Autorizada) return;
        if (string.IsNullOrWhiteSpace(_opciones.Cuit) || _opciones.PuntoVenta <= 0)
            throw new BusinessRuleException("Configure Facturacion:Cuit y Facturacion:PuntoVenta.");
        var cliente = await _clientes.GetByIdAsync(pago.ClienteId, ct)
            ?? throw new NotFoundException("El cliente no existe.");
        var items = new List<ArcaItem>();
        // Una reejecución desde US-F4-09 puede cargar el pago sin sus navegaciones.
        var detalles = _pagos.Query().Where(p => p.Id == pagoId)
            .SelectMany(p => p.PagoCuotas).ToList();
        if (detalles.Count == 0)
            throw new BusinessRuleException("El pago no contiene cuotas para facturar.");
        foreach (var detalle in detalles)
        {
            var cuota = await _cuotas.GetByIdAsync(detalle.CuotaId, ct)
                ?? throw new NotFoundException("La cuota no existe.");
            var poliza = await _polizas.GetByIdAsync(cuota.PolizaId, ct)
                ?? throw new NotFoundException("La póliza no existe.");
            items.Add(new($"Póliza {poliza.Numero} - Cuota {cuota.Numero} de {poliza.VigenciaMeses}", 1, detalle.Importe));
        }
        if (factura is null)
        {
            factura = Factura.CrearPendienteCae(pago, _reloj.GetUtcNow().UtcDateTime);
            await _facturas.AddAsync(factura, ct);
            await _unitOfWork.SaveChangesAsync(ct);
        }
        var neto = Math.Round(pago.ImporteTotal / FactorIva, 2, MidpointRounding.AwayFromZero);
        var request = new ArcaFacturaRequest(_opciones.Cuit, _opciones.PuntoVenta, "B", "SERVICIOS",
            DateOnly.FromDateTime(factura.FechaEmision),
            new("DNI", cliente.Dni, $"{cliente.Nombre} {cliente.Apellido}", "CONSUMIDOR_FINAL"),
            items, neto, pago.ImporteTotal - neto, pago.ImporteTotal, pago.Numero);
        try
        {
            var response = await _arca.EmitirFacturaAsync(request, ct);
            if (response.Estado == "APROBADA")
            {
                // Registrar antes de validar/persistir permite conciliar si falla cualquiera de ambos pasos.
                _logger.LogInformation("ARCA_AUTORIZACION_RECIBIDA PagoId={PagoId} Numero={Numero} Cae={Cae} Vencimiento={Vencimiento}",
                    pago.Id, response.NumeroComprobante, response.Cae, response.VencimientoCae);
                try
                {
                    factura.Autorizar(response.NumeroComprobante, response.Cae, response.VencimientoCae);
                    await _unitOfWork.SaveChangesAsync(ct);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "ARCA_AUTORIZACION_NO_PERSISTIDA PagoId={PagoId} Numero={Numero} Cae={Cae}",
                        pago.Id, response.NumeroComprobante, response.Cae);
                    throw;
                }
            }
            else _logger.LogWarning("ARCA_ESTADO_NO_APROBADO PagoId={PagoId} Estado={Estado}", pago.Id, response.Estado);
        }
        catch (ExternalServiceException)
        {
            // El pago ya fue confirmado y la factura queda disponible para US-F4-09.
        }
    }
}
