using Aseguradora.Application.Dtos;
using Aseguradora.Application.Exceptions;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Domain.Interfaces;

namespace Aseguradora.Application.Services;

/// <summary>
/// Manages insurance coverage plans (CU08) and enforces RN05 and RN15.
/// </summary>
public sealed class PlanService(IRepository<Plan> planes, IUnitOfWork unitOfWork) : IPlanService
{
    private const int DecimalesMoneda = 2;

    private readonly IRepository<Plan> _planes = planes ?? throw new ArgumentNullException(nameof(planes));
    private readonly IUnitOfWork _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));

    /// <inheritdoc />
    public async Task<IReadOnlyList<PlanResponse>> ListarActivosAsync(CancellationToken ct = default)
    {
        var activos = await _planes.FindAsync(p => p.Activo, ct);
        return activos
            .OrderBy(p => p.Codigo, StringComparer.OrdinalIgnoreCase)
            .Select(Mapear)
            .ToList();
    }

    /// <inheritdoc />
    public async Task<PlanResponse> ObtenerActivoAsync(Guid id, CancellationToken ct = default)
    {
        var plan = await _planes.GetByIdAsync(id, ct);
        if (plan is null || !plan.Activo)
            throw new NotFoundException($"El plan {id} no existe o no está activo.");

        return Mapear(plan);
    }

    /// <inheritdoc />
    public async Task<PlanResponse> CrearAsync(PlanRequest request, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var (codigo, nombre, descripcion, primaBase, tiposPermitidos) = ValidarYNormalizar(request);

        var codigoExiste = await _planes.AnyAsync(p => p.Codigo == codigo, ct);
        if (codigoExiste)
            throw new BusinessRuleException($"Ya existe un plan con el código '{codigo}'.");

        var plan = new Plan
        {
            Id = Guid.NewGuid(),
            Codigo = codigo,
            Nombre = nombre,
            Descripcion = descripcion,
            PrimaBase = primaBase,
            TiposPermitidos = tiposPermitidos,
            AntiguedadMaxima = request.AntiguedadMaxima,
            Activo = true
        };

        await _planes.AddAsync(plan, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        return Mapear(plan);
    }

    /// <inheritdoc />
    public async Task<PlanResponse> ActualizarAsync(Guid id, PlanRequest request, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var plan = await _planes.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"El plan {id} no existe.");

        var (codigo, nombre, descripcion, primaBase, tiposPermitidos) = ValidarYNormalizar(request);

        var codigoDuplicado = await _planes.AnyAsync(p => p.Codigo == codigo && p.Id != id, ct);
        if (codigoDuplicado)
            throw new BusinessRuleException($"Ya existe otro plan con el código '{codigo}'.");

        plan.Codigo = codigo;
        plan.Nombre = nombre;
        plan.Descripcion = descripcion;
        plan.PrimaBase = primaBase;
        plan.TiposPermitidos = tiposPermitidos;
        plan.AntiguedadMaxima = request.AntiguedadMaxima;

        _planes.Update(plan);
        await _unitOfWork.SaveChangesAsync(ct);

        return Mapear(plan);
    }

    /// <inheritdoc />
    public async Task DesactivarAsync(Guid id, CancellationToken ct = default)
    {
        var plan = await _planes.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"El plan {id} no existe.");

        plan.Activo = false;
        _planes.Update(plan);
        await _unitOfWork.SaveChangesAsync(ct);
    }

    private static (string Codigo, string Nombre, string Descripcion, decimal PrimaBase, string TiposPermitidos)
        ValidarYNormalizar(PlanRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Codigo))
            throw new BusinessRuleException("El código del plan es obligatorio.");

        if (string.IsNullOrWhiteSpace(request.Nombre))
            throw new BusinessRuleException("El nombre del plan es obligatorio.");

        if (string.IsNullOrWhiteSpace(request.Descripcion))
            throw new BusinessRuleException("La descripción del plan es obligatoria.");

        if (request.PrimaBase <= 0)
            throw new BusinessRuleException("La prima base debe ser mayor que cero.");

        if (request.AntiguedadMaxima is < 0)
            throw new BusinessRuleException("La antigüedad máxima debe ser mayor o igual a cero.");

        var tiposPermitidos = NormalizarTiposPermitidos(request.TiposPermitidos);
        var codigo = request.Codigo.Trim().ToUpperInvariant();
        var nombre = request.Nombre.Trim();
        var descripcion = request.Descripcion.Trim();
        var primaBase = Math.Round(request.PrimaBase, DecimalesMoneda, MidpointRounding.AwayFromZero);

        return (codigo, nombre, descripcion, primaBase, tiposPermitidos);
    }

    private static string NormalizarTiposPermitidos(string? tiposPermitidos)
    {
        if (string.IsNullOrWhiteSpace(tiposPermitidos))
            throw new BusinessRuleException("Debe indicar al menos un tipo de vehículo permitido.");

        var partes = tiposPermitidos.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
        if (partes.Length == 0)
            throw new BusinessRuleException("Debe indicar al menos un tipo de vehículo permitido.");

        var normalizados = new List<string>(partes.Length);
        foreach (var parte in partes)
        {
            if (!Enum.TryParse<TipoVehiculo>(parte, ignoreCase: true, out var tipo) || !Enum.IsDefined(tipo))
                throw new BusinessRuleException($"El tipo de vehículo '{parte}' no es válido.");

            var nombreCanonico = tipo.ToString();
            if (!normalizados.Contains(nombreCanonico, StringComparer.Ordinal))
                normalizados.Add(nombreCanonico);
        }

        return string.Join(",", normalizados);
    }

    private static PlanResponse Mapear(Plan plan) => new(
        Id: plan.Id,
        Codigo: plan.Codigo,
        Nombre: plan.Nombre,
        Descripcion: plan.Descripcion,
        PrimaBase: plan.PrimaBase,
        TiposPermitidos: plan.TiposPermitidos,
        AntiguedadMaxima: plan.AntiguedadMaxima,
        Activo: plan.Activo);
}
