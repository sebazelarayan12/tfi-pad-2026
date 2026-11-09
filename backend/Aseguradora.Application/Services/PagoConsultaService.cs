using Aseguradora.Application.Comun;
using Aseguradora.Application.Dtos;
using Aseguradora.Application.Exceptions;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Domain.Interfaces;

namespace Aseguradora.Application.Services;

/// <inheritdoc />
public sealed class PagoConsultaService(
    IRepository<Pago> pagos,
    IRepository<Factura> facturas,
    IRepository<Poliza> polizas) : IPagoConsultaService
{
    /// <inheritdoc />
    public Task<PaginaResponse<PagoListadoResponse>> ListarAsync(PagoFiltro filtro, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(filtro);
        ct.ThrowIfCancellationRequested();

        var consulta = pagos.Query();
        if (!string.IsNullOrWhiteSpace(filtro.Estado))
        {
            var estado = ParsearEstado(filtro.Estado);
            consulta = consulta.Where(p => p.Estado == estado);
        }
        if (!string.IsNullOrWhiteSpace(filtro.Medio))
        {
            var medio = ParsearMedio(filtro.Medio);
            consulta = consulta.Where(p => p.Medio == medio);
        }
        if (!string.IsNullOrWhiteSpace(filtro.NumeroPoliza))
        {
            var numero = filtro.NumeroPoliza.Trim().ToUpperInvariant();
            consulta = consulta.Where(p => p.PagoCuotas.Any(pc => pc.Cuota.Poliza.Numero == numero));
        }

        // Filter, order, page and count run in the database; only the page is loaded.
        var total = consulta.Count();
        var filas = consulta
            // Newest first; the number breaks ties between payments created at the same instant.
            .OrderByDescending(p => p.FechaCreacion)
            .ThenByDescending(p => p.Numero)
            .Skip((filtro.Pagina - 1) * filtro.Tamano)
            .Take(filtro.Tamano)
            .Select(p => new
            {
                p.Id,
                p.Numero,
                p.FechaCreacion,
                p.Medio,
                p.ImporteTotal,
                p.Estado,
                Nombre = p.Cliente.Nombre,
                Apellido = p.Cliente.Apellido,
                Cuotas = p.PagoCuotas
                    .Select(pc => new { pc.Cuota.Numero, PolizaNumero = pc.Cuota.Poliza.Numero })
                    .ToList(),
                FacturaNumero = p.Factura != null ? p.Factura.Numero : null,
                FacturaEstado = p.Factura != null ? (EstadoFactura?)p.Factura.Estado : null,
            })
            .ToList();

        var items = filas
            .Select(f => new PagoListadoResponse(
                f.Id,
                f.Numero,
                PagoService.ComoUtc(f.FechaCreacion),
                $"{f.Nombre} {f.Apellido}",
                f.Cuotas.Select(c => c.PolizaNumero).Order(StringComparer.Ordinal).FirstOrDefault() ?? string.Empty,
                f.Cuotas.Select(c => c.Numero).Order().ToList(),
                TextoMedio(f.Medio),
                f.ImporteTotal,
                TextoEstado(f.Estado),
                f.FacturaEstado is { } estadoFactura
                    ? new PagoFacturaResumen(f.FacturaNumero ?? string.Empty, TextoEstadoFactura(estadoFactura))
                    : null))
            .ToList();

        return Task.FromResult(new PaginaResponse<PagoListadoResponse>(items, filtro.Pagina, filtro.Tamano, total));
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<PagoResponse>> ListarPorPolizaAsync(Guid polizaId, CancellationToken ct = default)
    {
        if (!await polizas.AnyAsync(p => p.Id == polizaId, ct))
            throw new NotFoundException("La póliza no existe.");

        var delaPoliza = await pagos.FindAsync(p => p.PagoCuotas.Any(pc => pc.Cuota.PolizaId == polizaId), ct);
        var ids = delaPoliza.Select(p => p.Id).ToList();
        var facturasPorPago = (await facturas.FindAsync(f => ids.Contains(f.PagoId), ct))
            .ToDictionary(f => f.PagoId);

        return delaPoliza
            .OrderByDescending(p => p.FechaCreacion)
            .ThenByDescending(p => p.Numero, StringComparer.Ordinal)
            .Select(p => PagoService.MapearPago(p, facturasPorPago.GetValueOrDefault(p.Id)))
            .ToList();
    }

    private static EstadoPago ParsearEstado(string texto) => texto.Trim().ToUpperInvariant() switch
    {
        ValoresPagoResponse.Pendiente => EstadoPago.Pendiente,
        ValoresPagoResponse.Aprobado => EstadoPago.Aprobado,
        ValoresPagoResponse.Rechazado => EstadoPago.Rechazado,
        _ => throw new BusinessRuleException("El estado debe ser PENDIENTE, APROBADO o RECHAZADO."),
    };

    private static MedioPago ParsearMedio(string texto) => texto.Trim().ToUpperInvariant() switch
    {
        ValoresPagoResponse.Caja => MedioPago.Caja,
        ValoresPagoResponse.Pasarela => MedioPago.Pasarela,
        ValoresPagoResponse.PagoFacil => MedioPago.PagoFacil,
        _ => throw new BusinessRuleException("El medio debe ser CAJA, PASARELA o PAGO_FACIL."),
    };

    private static string TextoEstado(EstadoPago estado) => estado switch
    {
        EstadoPago.Pendiente => ValoresPagoResponse.Pendiente,
        EstadoPago.Aprobado => ValoresPagoResponse.Aprobado,
        EstadoPago.Rechazado => ValoresPagoResponse.Rechazado,
        _ => throw new InvalidOperationException("Estado de pago desconocido."),
    };

    private static string TextoMedio(MedioPago medio) => medio switch
    {
        MedioPago.Caja => ValoresPagoResponse.Caja,
        MedioPago.Pasarela => ValoresPagoResponse.Pasarela,
        MedioPago.PagoFacil => ValoresPagoResponse.PagoFacil,
        _ => throw new InvalidOperationException("Medio de pago desconocido."),
    };

    private static string TextoEstadoFactura(EstadoFactura estado) =>
        estado == EstadoFactura.PendienteCae ? ValoresPagoResponse.PendienteCae : ValoresPagoResponse.Autorizada;
}
