using Aseguradora.Application.Dtos;
using Aseguradora.Application.Exceptions;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Domain.Interfaces;

namespace Aseguradora.Application.Services;

/// <summary>
/// Internal quote of a registered vehicle against every compatible plan (CU09, RN05, RN06, RN16).
/// </summary>
public sealed class CotizacionService(
    IRepository<Vehiculo> vehiculos,
    IRepository<Cliente> clientes,
    IRepository<Plan> planes,
    IRepository<Cotizacion> cotizaciones,
    IUnitOfWork unitOfWork,
    TimeProvider reloj) : ICotizacionService
{
    /// <summary>Days a quote stays valid after it is created (RN06).</summary>
    public const int DiasDeVigencia = 15;

    private readonly IRepository<Vehiculo> _vehiculos = vehiculos ?? throw new ArgumentNullException(nameof(vehiculos));
    private readonly IRepository<Cliente> _clientes = clientes ?? throw new ArgumentNullException(nameof(clientes));
    private readonly IRepository<Plan> _planes = planes ?? throw new ArgumentNullException(nameof(planes));
    private readonly IRepository<Cotizacion> _cotizaciones = cotizaciones ?? throw new ArgumentNullException(nameof(cotizaciones));
    private readonly IUnitOfWork _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    private readonly TimeProvider _reloj = reloj ?? throw new ArgumentNullException(nameof(reloj));

    /// <inheritdoc />
    public async Task<CotizacionDto> ObtenerAsync(Guid id, CancellationToken ct = default)
    {
        var cotizacion = await _cotizaciones.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"La cotización {id} no existe.");

        var plan = await _planes.GetByIdAsync(cotizacion.PlanId, ct)
            ?? throw new NotFoundException($"El plan {cotizacion.PlanId} de la cotización {id} no existe.");

        return new CotizacionDto(
            Id: cotizacion.Id,
            PlanId: cotizacion.PlanId,
            CodigoPlan: plan.Codigo,
            ClienteId: cotizacion.ClienteId,
            VehiculoId: cotizacion.VehiculoId,
            PrimaMensual: cotizacion.PrimaMensual,
            FechaCotizacion: cotizacion.FechaCotizacion,
            FechaVencimiento: cotizacion.FechaVencimiento,
            Origen: cotizacion.Origen);
    }

    /// <inheritdoc />
    public async Task<CotizacionResultado> CotizarVehiculoAsync(Guid vehiculoId, CancellationToken ct = default)
    {
        var vehiculo = await _vehiculos.GetByIdAsync(vehiculoId, ct)
            ?? throw new NotFoundException($"El vehículo {vehiculoId} no existe.");

        if (!vehiculo.Activo)
            throw new BusinessRuleException($"El vehículo {vehiculoId} está dado de baja y no se puede cotizar.");

        var cliente = await _clientes.GetByIdAsync(vehiculo.ClienteId, ct)
            ?? throw new NotFoundException($"El cliente {vehiculo.ClienteId} del vehículo no existe.");

        var ahora = _reloj.GetUtcNow().UtcDateTime;
        var edad = MotorCotizacion.CalcularEdad(cliente.FechaNacimiento, DateOnly.FromDateTime(ahora));

        var planesActivos = await _planes.FindAsync(p => p.Activo, ct);
        var opciones = MotorCotizacion.Cotizar(
            planesActivos, vehiculo.Tipo, vehiculo.Anio, ahora.Year, edad, vehiculo.Uso);

        if (opciones.Count == 0)
            throw new BusinessRuleException("Ningún plan es compatible con el vehículo.");

        var vencimiento = ahora.AddDays(DiasDeVigencia);
        var resultado = new List<OpcionCotizacion>(opciones.Count);

        foreach (var (plan, prima) in opciones)
        {
            var cotizacion = new Cotizacion
            {
                Id = Guid.NewGuid(),
                PlanId = plan.Id,
                ClienteId = cliente.Id,
                VehiculoId = vehiculo.Id,
                TipoVehiculo = vehiculo.Tipo,
                AnioVehiculo = vehiculo.Anio,
                Uso = vehiculo.Uso,
                EdadConductor = edad,
                PrimaMensual = prima,
                FechaCotizacion = ahora,
                FechaVencimiento = vencimiento,
                Origen = OrigenCotizacion.Panel
            };

            await _cotizaciones.AddAsync(cotizacion, ct);
            resultado.Add(new OpcionCotizacion(cotizacion.Id, plan.Codigo, plan.Nombre, prima));
        }

        await _unitOfWork.SaveChangesAsync(ct);

        return new CotizacionResultado(vencimiento, resultado);
    }
}
