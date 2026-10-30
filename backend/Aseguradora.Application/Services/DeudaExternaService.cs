using Aseguradora.Application.Dtos;
using Aseguradora.Application.Exceptions;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Domain.Interfaces;

namespace Aseguradora.Application.Services;

/// <summary>
/// Lists the unpaid installments (Pendiente or Vencida) of a client, grouped by policy. It shows the stored
/// state: an overdue installment appears as Vencida only once the expiry job has run (spec decision, US-F4-07).
/// Policies whose installments are all paid, voided or otherwise closed are left out.
/// </summary>
public sealed class DeudaExternaService(
    IRepository<Cliente> clientes,
    IRepository<Poliza> polizas,
    IRepository<Cuota> cuotas,
    IRepository<Vehiculo> vehiculos) : IDeudaExternaService
{
    /// <inheritdoc />
    public async Task<DeudaExternaResponse> ObtenerDeudaAsync(string dni, CancellationToken ct = default)
    {
        var cliente = (await clientes.FindAsync(c => c.Dni == dni, ct)).SingleOrDefault()
            ?? throw new NotFoundException("No existe un cliente con ese DNI.", "CLIENTE_NO_ENCONTRADO");

        var polizasCliente = await polizas.FindAsync(p => p.ClienteId == cliente.Id, ct);
        var polizaIds = polizasCliente.Select(p => p.Id).ToArray();
        var cuotasImpagas = await cuotas.FindAsync(
            c => polizaIds.Contains(c.PolizaId) && (c.Estado == EstadoCuota.Pendiente || c.Estado == EstadoCuota.Vencida),
            ct);

        var cuotasPorPoliza = cuotasImpagas
            .GroupBy(c => c.PolizaId)
            .ToDictionary(g => g.Key, g => g.OrderBy(c => c.Numero).ToList());

        var polizasConDeuda = polizasCliente
            .Where(p => cuotasPorPoliza.ContainsKey(p.Id))
            .OrderBy(p => p.Numero, StringComparer.Ordinal)
            .ToList();

        var vehiculoIds = polizasConDeuda.Select(p => p.VehiculoId).ToArray();
        var patentes = (await vehiculos.FindAsync(v => vehiculoIds.Contains(v.Id), ct))
            .ToDictionary(v => v.Id, v => v.Patente);

        var detalle = polizasConDeuda
            .Select(p => new DeudaExternaPoliza(
                p.Numero,
                patentes[p.VehiculoId],
                cuotasPorPoliza[p.Id].Select(CrearCuota).ToList()))
            .ToList();

        var totalAdeudado = Redondear(detalle.Sum(p => p.Cuotas.Sum(c => c.Total)));

        return new DeudaExternaResponse(dni, $"{cliente.Nombre} {cliente.Apellido}", totalAdeudado, detalle);
    }

    private static DeudaExternaCuota CrearCuota(Cuota cuota)
    {
        var importe = Redondear(cuota.Importe);
        var recargo = Redondear(cuota.Recargo);

        return new DeudaExternaCuota(
            cuota.Id,
            cuota.Numero,
            importe,
            recargo,
            Redondear(importe + recargo),
            cuota.FechaVencimiento,
            cuota.Estado.ToString().ToUpperInvariant());
    }

    // Two decimals, rounded half away from zero (as TasaRecargoMora). Adding 0.00m keeps the scale at two,
    // so a zero amount is serialized as 0.00 and not as 0.
    private static decimal Redondear(decimal importe) => Math.Round(importe, 2, MidpointRounding.AwayFromZero) + 0.00m;
}
