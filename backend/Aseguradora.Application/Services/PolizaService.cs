using Aseguradora.Application.Comun;
using Aseguradora.Application.Dtos.Polizas;
using Aseguradora.Application.Exceptions;
using Aseguradora.Application.Tiempo;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Domain.Interfaces;
using Aseguradora.Domain.Services;

namespace Aseguradora.Application.Services;

/// <summary>
/// Issues, lists, shows and cancels policies (CU10 to CU13). Issuing checks every rule before anything
/// is added, and the policy and its installments are saved with a single
/// <see cref="IUnitOfWork.SaveChangesAsync"/>.
/// </summary>
public sealed class PolizaService(
    IRepository<Cotizacion> cotizaciones,
    IRepository<Cliente> clientes,
    IRepository<Vehiculo> vehiculos,
    IRepository<Plan> planes,
    IRepository<Poliza> polizas,
    IRepository<Cuota> cuotas,
    INumeradorPolizas numerador,
    IUnitOfWork unitOfWork,
    TimeProvider reloj) : IPolizaService
{
    /// <summary>States in which a policy still holds the vehicle, so it cannot get another one (RN04).</summary>
    private static readonly EstadoPoliza[] EstadosActivos =
        [EstadoPoliza.Pendiente, EstadoPoliza.Vigente, EstadoPoliza.Suspendida];

    /// <inheritdoc />
    public async Task<PolizaDetalleResponse> EmitirAsync(EmitirPolizaRequest request, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var ahora = reloj.GetUtcNow().UtcDateTime;
        var hoy = FechaArgentina.Hoy(reloj);

        var cotizacion = await ValidarCotizacionAsync(request.CotizacionId, ahora, ct);
        var cliente = await ValidarClienteAsync(cotizacion.ClienteId!.Value, ct);
        var vehiculo = await ValidarVehiculoAsync(cotizacion.VehiculoId!.Value, cliente, ct);
        var plan = await ValidarPlanAsync(cotizacion.PlanId, vehiculo, hoy, ct);

        var polizaId = Guid.NewGuid();
        // Also validates the term (1, 6 or 12 months) before a policy number is consumed.
        var cuotas = CalculadorCuotas.GenerarCuotas(polizaId, cotizacion.PrimaMensual, hoy, request.VigenciaMeses);

        var poliza = new Poliza
        {
            Id = polizaId,
            Numero = await numerador.SiguienteNumeroAsync(ct),
            ClienteId = cliente.Id,
            VehiculoId = vehiculo.Id,
            PlanId = plan.Id,
            CotizacionId = cotizacion.Id,
            // RN06: the premium stored in the quote is used as is, never recalculated.
            PrimaMensual = cotizacion.PrimaMensual,
            VigenciaMeses = request.VigenciaMeses,
            FechaEmision = ahora,
            FechaInicio = hoy,
            FechaFin = hoy.AddMonths(request.VigenciaMeses),
            Estado = EstadoPoliza.Pendiente,
            Cuotas = cuotas.ToList()
        };

        await polizas.AddAsync(poliza, ct);
        try
        {
            await unitOfWork.SaveChangesAsync(ct);
        }
        catch (ViolacionUnicidadException ex)
        {
            // Two issues at the same time passed the checks above; the unique indexes on CotizacionId
            // and on the vehicle's active policy stop the second one (RN04).
            throw new BusinessRuleException(
                "Otra emisión con la misma cotización o el mismo vehículo se guardó al mismo tiempo (RN04). Recargue los datos.", ex);
        }

        return Mapear(poliza, vehiculo, plan);
    }

    /// <inheritdoc />
    public Task<PaginaResponse<PolizaListItemResponse>> ListarAsync(PolizaFiltro filtro, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(filtro);
        ct.ThrowIfCancellationRequested();

        var consulta = polizas.Query();
        if (filtro.Estado is { } estado)
            consulta = consulta.Where(p => p.Estado == estado);
        if (filtro.ClienteId is { } clienteId)
            consulta = consulta.Where(p => p.ClienteId == clienteId);
        if (!string.IsNullOrWhiteSpace(filtro.Patente))
        {
            var patente = filtro.Patente.Trim().ToUpperInvariant();
            consulta = consulta.Where(p => p.Vehiculo.Patente == patente);
        }

        // Filter, order, page and count run in the database; only the page is loaded.
        var total = consulta.Count();
        var items = consulta
            // Newest first; the number breaks ties between policies issued at the same instant.
            .OrderByDescending(p => p.FechaEmision)
            .ThenByDescending(p => p.Numero)
            .Skip((filtro.Pagina - 1) * filtro.Tamano)
            .Take(filtro.Tamano)
            .Select(p => new PolizaListItemResponse(
                p.Id, p.Numero, p.ClienteId, p.Vehiculo.Patente, p.Plan.Codigo,
                p.PrimaMensual, p.FechaInicio, p.FechaFin, p.Estado))
            .ToList();

        return Task.FromResult(new PaginaResponse<PolizaListItemResponse>(items, filtro.Pagina, filtro.Tamano, total));
    }

    /// <inheritdoc />
    public async Task<PolizaDetalleResponse> ObtenerAsync(Guid id, CancellationToken ct = default)
    {
        var poliza = await CargarConCuotasAsync(id, ct);
        return await MapearAsync(poliza, ct);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<CuotaResponse>> ObtenerCuotasAsync(Guid id, CancellationToken ct = default)
    {
        if (!await polizas.AnyAsync(p => p.Id == id, ct))
            throw new NotFoundException($"La póliza {id} no existe.");

        var deLaPoliza = await cuotas.FindAsync(c => c.PolizaId == id, ct);
        return deLaPoliza.OrderBy(c => c.Numero).Select(MapearCuota).ToList();
    }

    /// <inheritdoc />
    public async Task<PolizaDetalleResponse> CancelarAsync(Guid id, CancelarPolizaRequest request, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var poliza = await CargarConCuotasAsync(id, ct);
        // RN13: only Pendiente, Vigente or Suspendida; voids every unpaid installment.
        poliza.Cancelar(request.Motivo, reloj.GetUtcNow().UtcDateTime);
        await unitOfWork.SaveChangesAsync(ct);

        return await MapearAsync(poliza, ct);
    }

    private async Task<Poliza> CargarConCuotasAsync(Guid id, CancellationToken ct)
    {
        var poliza = await polizas.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"La póliza {id} no existe.");

        // Loaded through the same unit of work, so they also fill poliza.Cuotas.
        var deLaPoliza = await cuotas.FindAsync(c => c.PolizaId == id, ct);
        foreach (var cuota in deLaPoliza.Where(c => !poliza.Cuotas.Contains(c)))
            poliza.Cuotas.Add(cuota);

        return poliza;
    }

    private async Task<PolizaDetalleResponse> MapearAsync(Poliza poliza, CancellationToken ct)
    {
        var vehiculo = await vehiculos.GetByIdAsync(poliza.VehiculoId, ct)
            ?? throw new NotFoundException($"El vehículo {poliza.VehiculoId} de la póliza no existe.");
        var plan = await planes.GetByIdAsync(poliza.PlanId, ct)
            ?? throw new NotFoundException($"El plan {poliza.PlanId} de la póliza no existe.");
        return Mapear(poliza, vehiculo, plan);
    }

    private async Task<Cotizacion> ValidarCotizacionAsync(Guid cotizacionId, DateTime ahora, CancellationToken ct)
    {
        var cotizacion = await cotizaciones.GetByIdAsync(cotizacionId, ct)
            ?? throw new NotFoundException($"La cotización {cotizacionId} no existe.");

        // Same rule as CotizacionDto.EstaVigente (US-F2-01): valid up to and including its expiry.
        if (ahora > cotizacion.FechaVencimiento)
            throw new BusinessRuleException("La cotización está vencida (RN06).");

        if (await polizas.AnyAsync(p => p.CotizacionId == cotizacionId, ct))
            throw new BusinessRuleException("La cotización ya se usó para emitir una póliza.");

        if (cotizacion.ClienteId is null || cotizacion.VehiculoId is null)
            throw new BusinessRuleException(
                "La cotización no tiene cliente ni vehículo registrados: no se puede emitir una póliza desde una cotización externa.");

        return cotizacion;
    }

    private async Task<Cliente> ValidarClienteAsync(Guid clienteId, CancellationToken ct)
    {
        var cliente = await clientes.GetByIdAsync(clienteId, ct);
        if (cliente is null || !cliente.Activo)
            throw new BusinessRuleException("El cliente de la cotización no existe o no está activo.");

        if (!cliente.ValidadoRenaper)
            throw new BusinessRuleException("El cliente no está validado en Renaper (RN02).");

        return cliente;
    }

    private async Task<Vehiculo> ValidarVehiculoAsync(Guid vehiculoId, Cliente cliente, CancellationToken ct)
    {
        var vehiculo = await vehiculos.GetByIdAsync(vehiculoId, ct);
        if (vehiculo is null || !vehiculo.Activo)
            throw new BusinessRuleException("El vehículo de la cotización no existe o no está activo.");

        if (!vehiculo.ValidadoDnrpa)
            throw new BusinessRuleException("El vehículo no está validado en DNRPA (RN03).");

        if (vehiculo.ClienteId != cliente.Id)
            throw new BusinessRuleException("El vehículo no pertenece al cliente de la cotización (RN03).");

        var tienePolizaActiva = await polizas.AnyAsync(
            p => p.VehiculoId == vehiculo.Id && EstadosActivos.Contains(p.Estado), ct);
        if (tienePolizaActiva)
            throw new BusinessRuleException(
                $"El vehículo {vehiculo.Patente} ya tiene una póliza pendiente, vigente o suspendida (RN04).");

        return vehiculo;
    }

    private async Task<Plan> ValidarPlanAsync(Guid planId, Vehiculo vehiculo, DateOnly hoy, CancellationToken ct)
    {
        var plan = await planes.GetByIdAsync(planId, ct);
        if (plan is null || !plan.Activo)
            throw new BusinessRuleException("El plan de la cotización no existe o no está activo.");

        var tiposPermitidos = plan.TiposPermitidos.Split(
            ',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
        if (!tiposPermitidos.Contains(vehiculo.Tipo.ToString(), StringComparer.OrdinalIgnoreCase))
            throw new BusinessRuleException($"El plan {plan.Codigo} no acepta vehículos de tipo {vehiculo.Tipo} (RN05).");

        var antiguedad = hoy.Year - vehiculo.Anio;
        if (plan.AntiguedadMaxima is { } maxima && antiguedad > maxima)
            throw new BusinessRuleException(
                $"El plan {plan.Codigo} acepta vehículos de hasta {maxima} años y este tiene {antiguedad} (RN05).");

        return plan;
    }

    private static PolizaDetalleResponse Mapear(Poliza poliza, Vehiculo vehiculo, Plan plan) => new(
        Id: poliza.Id,
        Numero: poliza.Numero,
        ClienteId: poliza.ClienteId,
        VehiculoId: poliza.VehiculoId,
        Patente: vehiculo.Patente,
        Marca: vehiculo.Marca,
        Modelo: vehiculo.Modelo,
        PlanId: poliza.PlanId,
        CodigoPlan: plan.Codigo,
        NombrePlan: plan.Nombre,
        CotizacionId: poliza.CotizacionId,
        PrimaMensual: poliza.PrimaMensual,
        VigenciaMeses: poliza.VigenciaMeses,
        FechaEmision: poliza.FechaEmision,
        FechaInicio: poliza.FechaInicio,
        FechaFin: poliza.FechaFin,
        Estado: poliza.Estado,
        Cuotas: poliza.Cuotas
            .OrderBy(c => c.Numero)
            .Select(MapearCuota)
            .ToList());

    private static CuotaResponse MapearCuota(Cuota c) =>
        new(c.Id, c.Numero, c.Importe, c.Recargo, c.FechaVencimiento, c.Estado, c.FechaPago);
}
