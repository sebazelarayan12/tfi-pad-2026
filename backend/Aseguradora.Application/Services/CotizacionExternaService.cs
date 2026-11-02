using Aseguradora.Application.Dtos;
using Aseguradora.Application.Exceptions;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Domain.Interfaces;

namespace Aseguradora.Application.Services;

/// <summary>Quotes unregistered vehicles for external systems (CU09, RN05, RN06).</summary>
public sealed class CotizacionExternaService(
    IRepository<Plan> planes,
    IRepository<Cotizacion> cotizaciones,
    IUnitOfWork unitOfWork,
    TimeProvider reloj) : ICotizacionExternaService
{
    private readonly IRepository<Plan> _planes = planes ?? throw new ArgumentNullException(nameof(planes));
    private readonly IRepository<Cotizacion> _cotizaciones = cotizaciones ?? throw new ArgumentNullException(nameof(cotizaciones));
    private readonly IUnitOfWork _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    private readonly TimeProvider _reloj = reloj ?? throw new ArgumentNullException(nameof(reloj));

    /// <inheritdoc />
    public async Task<CotizacionResultado> CotizarExternoAsync(CotizacionExternaRequest request, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        var ahora = _reloj.GetUtcNow().UtcDateTime;
        if (!Enum.IsDefined(request.TipoVehiculo))
            throw new BusinessRuleException("El tipo de vehículo no es válido.");
        if (!Enum.IsDefined(request.Uso))
            throw new BusinessRuleException("El uso del vehículo no es válido.");
        if (request.EdadConductor is < 0 or > 120)
            throw new BusinessRuleException("La edad del conductor debe estar entre 0 y 120 años.");
        if (request.Anio < 1900 || request.Anio > ahora.Year + 1)
            throw new BusinessRuleException("El año debe estar entre 1900 y el año actual más uno.");

        var planesActivos = await _planes.FindAsync(p => p.Activo, ct);
        var opciones = MotorCotizacion.Cotizar(planesActivos, request.TipoVehiculo, request.Anio,
            ahora.Year, request.EdadConductor, request.Uso);
        if (opciones.Count == 0)
            throw new BusinessRuleException("Ningún plan es compatible con el vehículo.");

        var vencimiento = ahora.AddDays(CotizacionService.DiasDeVigencia);
        var resultado = new List<OpcionCotizacion>(opciones.Count);
        foreach (var (plan, prima) in opciones)
        {
            var cotizacion = new Cotizacion
            {
                Id = Guid.NewGuid(),
                PlanId = plan.Id,
                ClienteId = null,
                VehiculoId = null,
                TipoVehiculo = request.TipoVehiculo,
                AnioVehiculo = request.Anio,
                Uso = request.Uso,
                EdadConductor = request.EdadConductor,
                PrimaMensual = prima,
                FechaCotizacion = ahora,
                FechaVencimiento = vencimiento,
                Origen = OrigenCotizacion.Externo
            };
            await _cotizaciones.AddAsync(cotizacion, ct);
            resultado.Add(new OpcionCotizacion(cotizacion.Id, plan.Codigo, plan.Nombre, prima));
        }
        await _unitOfWork.SaveChangesAsync(ct);
        return new CotizacionResultado(vencimiento, resultado);
    }
}
