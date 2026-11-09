using Aseguradora.Application.Dtos;
using Aseguradora.Application.Tiempo;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Domain.Interfaces;
using Aseguradora.Domain.Services;

namespace Aseguradora.Application.Services;

/// <inheritdoc />
public sealed class ResumenInicioService(
    IRepository<Poliza> polizas,
    IRepository<Cuota> cuotas,
    IRepository<Factura> facturas,
    IRepository<RendicionPagoFacil> rendiciones,
    TimeProvider reloj) : IResumenInicioService
{
    private const int CuotasRecientes = 5;

    /// <inheritdoc />
    public Task<ResumenInicioResponse> ObtenerAsync(CancellationToken ct = default)
    {
        ct.ThrowIfCancellationRequested();

        var hoy = FechaArgentina.Hoy(reloj);

        var conteos = polizas.Query()
            .GroupBy(p => p.Estado)
            .Select(g => new { Estado = g.Key, Cantidad = g.Count() })
            .ToList();
        var porEstado = Enum.GetValues<EstadoPoliza>()
            .ToDictionary(e => e.ToString(), e => conteos.FirstOrDefault(c => c.Estado == e)?.Cantidad ?? 0);

        var vencidas = cuotas.Query().Where(c => c.Estado == EstadoCuota.Vencida);
        var recientes = vencidas
            .OrderByDescending(c => c.FechaVencimiento)
            .ThenBy(c => c.Poliza.Numero)
            .ThenBy(c => c.Numero)
            .Take(CuotasRecientes)
            .Select(c => new CuotaVencidaResumen(
                c.Id,
                c.PolizaId,
                c.Poliza.Numero,
                c.Poliza.Cliente.Nombre,
                c.Poliza.Cliente.Apellido,
                c.Numero,
                c.FechaVencimiento,
                c.Importe,
                c.Recargo,
                c.Estado))
            .ToList();

        var resumen = new ResumenInicioResponse(
            hoy,
            porEstado,
            new CuotasVencidasResumen(vencidas.Count(), TasaRecargoMora.Valor * 100m, recientes),
            !rendiciones.Query().Any(r => r.FechaRendicion == hoy),
            facturas.Query().Count(f => f.Estado == EstadoFactura.PendienteCae));

        return Task.FromResult(resumen);
    }
}
