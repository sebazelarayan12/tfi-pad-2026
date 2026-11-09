using Aseguradora.Application.Comun;
using Aseguradora.Application.Dtos;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Interfaces;

namespace Aseguradora.Application.Services;

/// <inheritdoc />
public sealed class CotizacionConsultaService(IRepository<Cotizacion> cotizaciones, TimeProvider reloj)
    : ICotizacionConsultaService
{
    /// <inheritdoc />
    public Task<PaginaResponse<CotizacionListItemResponse>> ListarAsync(
        CotizacionFiltro filtro, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(filtro);
        ct.ThrowIfCancellationRequested();

        // A quote is valid up to and including its expiration (RN06).
        var ahora = reloj.GetUtcNow().UtcDateTime;

        var consulta = cotizaciones.Query();
        if (filtro.Vigente is { } vigente)
            consulta = vigente
                ? consulta.Where(c => c.FechaVencimiento >= ahora)
                : consulta.Where(c => c.FechaVencimiento < ahora);
        if (filtro.ClienteId is { } clienteId)
            consulta = consulta.Where(c => c.ClienteId == clienteId);
        if (filtro.VehiculoId is { } vehiculoId)
            consulta = consulta.Where(c => c.VehiculoId == vehiculoId);
        if (!string.IsNullOrWhiteSpace(filtro.Patente))
        {
            var patente = filtro.Patente.Trim().ToUpperInvariant();
            consulta = consulta.Where(c => c.Vehiculo != null && c.Vehiculo.Patente == patente);
        }

        // Filter, order, page and count run in the database; only the page is loaded.
        var total = consulta.Count();
        var filas = consulta
            // Newest first; the id breaks ties between quotes created at the same instant.
            .OrderByDescending(c => c.FechaCotizacion)
            .ThenByDescending(c => c.Id)
            .Skip((filtro.Pagina - 1) * filtro.Tamano)
            .Take(filtro.Tamano)
            .Select(c => new
            {
                c.Id,
                c.PlanId,
                CodigoPlan = c.Plan.Codigo,
                NombrePlan = c.Plan.Nombre,
                c.ClienteId,
                Nombre = c.Cliente != null ? c.Cliente.Nombre : null,
                Apellido = c.Cliente != null ? c.Cliente.Apellido : null,
                c.VehiculoId,
                Patente = c.Vehiculo != null ? c.Vehiculo.Patente : null,
                c.PrimaMensual,
                c.FechaCotizacion,
                c.FechaVencimiento,
                c.Origen,
            })
            .ToList();

        var items = filas
            .Select(f => new CotizacionListItemResponse(
                f.Id,
                f.PlanId,
                f.CodigoPlan,
                f.NombrePlan,
                f.ClienteId,
                f.Nombre is null ? null : $"{f.Nombre} {f.Apellido}",
                f.VehiculoId,
                f.Patente,
                f.PrimaMensual,
                EnUtc(f.FechaCotizacion),
                EnUtc(f.FechaVencimiento),
                EnUtc(f.FechaVencimiento) >= ahora,
                f.Origen))
            .ToList();

        return Task.FromResult(new PaginaResponse<CotizacionListItemResponse>(
            items, filtro.Pagina, filtro.Tamano, total));
    }

    // SQL Server datetime2 keeps the UTC ticks but materializes DateTimeKind.Unspecified.
    private static DateTime EnUtc(DateTime fecha) => fecha.Kind == DateTimeKind.Unspecified
        ? DateTime.SpecifyKind(fecha, DateTimeKind.Utc)
        : fecha.ToUniversalTime();
}
