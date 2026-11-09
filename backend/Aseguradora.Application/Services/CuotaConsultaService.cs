using Aseguradora.Application.Comun;
using Aseguradora.Application.Dtos;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Interfaces;

namespace Aseguradora.Application.Services;

/// <inheritdoc />
public sealed class CuotaConsultaService(IRepository<Cuota> cuotas) : ICuotaConsultaService
{
    /// <inheritdoc />
    public Task<PaginaResponse<CuotaListItemResponse>> ListarAsync(CuotaFiltro filtro, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(filtro);
        ct.ThrowIfCancellationRequested();

        var consulta = cuotas.Query();
        if (filtro.Estado is { } estado)
            consulta = consulta.Where(c => c.Estado == estado);
        if (filtro.PolizaId is { } polizaId)
            consulta = consulta.Where(c => c.PolizaId == polizaId);
        if (filtro.ClienteId is { } clienteId)
            consulta = consulta.Where(c => c.Poliza.ClienteId == clienteId);

        // Filter, order, page and count run in the database; only the page is loaded.
        var total = consulta.Count();
        var items = consulta
            // Oldest due date first; policy, installment number and id make the order total, so pages never overlap.
            .OrderBy(c => c.FechaVencimiento)
            .ThenBy(c => c.Poliza.Numero)
            .ThenBy(c => c.Numero)
            .ThenBy(c => c.Id)
            .Skip((filtro.Pagina - 1) * filtro.Tamano)
            .Take(filtro.Tamano)
            .Select(c => new CuotaListItemResponse(
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

        return Task.FromResult(new PaginaResponse<CuotaListItemResponse>(items, filtro.Pagina, filtro.Tamano, total));
    }
}
