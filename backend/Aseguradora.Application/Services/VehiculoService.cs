using Aseguradora.Application.Dtos;
using Aseguradora.Application.Exceptions;
using Aseguradora.Application.External;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Domain.Interfaces;

namespace Aseguradora.Application.Services;

/// <summary>
/// Handles vehicle registration (CU06). DNRPA is not queried: the data is typed in by the employee.
/// </summary>
public sealed class VehiculoService(
    IRepository<Vehiculo> vehiculos,
    IRepository<Cliente> clientes,
    IRepository<Poliza> polizas,
    IUnitOfWork unitOfWork) : IVehiculoService
{
    private const int AnioMinimo = 1950;

    private readonly IRepository<Vehiculo> _vehiculos = vehiculos ?? throw new ArgumentNullException(nameof(vehiculos));
    private readonly IRepository<Cliente> _clientes = clientes ?? throw new ArgumentNullException(nameof(clientes));
    private readonly IRepository<Poliza> _polizas = polizas ?? throw new ArgumentNullException(nameof(polizas));
    private readonly IUnitOfWork _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));

    /// <inheritdoc />
    public async Task<VehiculoResponse> AltaAsync(VehiculoAltaRequest request, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (string.IsNullOrWhiteSpace(request.Patente))
            throw new BusinessRuleException("La patente es obligatoria.");

        var patente = VehiculoAltaRequest.NormalizarPatente(request.Patente);
        if (!VehiculoAltaRequest.EsPatenteValida(patente))
            throw new BusinessRuleException($"La patente '{patente}' no tiene un formato válido (AA000AA o AAA000).");

        if (request.Uso is null || !Enum.IsDefined(request.Uso.Value))
            throw new BusinessRuleException("El uso del vehículo es obligatorio y debe ser válido.");

        if (string.IsNullOrWhiteSpace(request.Marca) || string.IsNullOrWhiteSpace(request.Modelo))
            throw new BusinessRuleException("La marca y el modelo son obligatorios.");

        if (string.IsNullOrWhiteSpace(request.NumeroMotor) || string.IsNullOrWhiteSpace(request.NumeroChasis))
            throw new BusinessRuleException("El número de motor y el de chasis son obligatorios.");

        var anioMaximo = DateTime.UtcNow.Year + 1;
        if (request.Anio is null || request.Anio < AnioMinimo || request.Anio > anioMaximo)
            throw new BusinessRuleException($"El año debe estar entre {AnioMinimo} y {anioMaximo}.");

        if (request.Tipo is null || !Enum.IsDefined(request.Tipo.Value))
            throw new BusinessRuleException("El tipo de vehículo es obligatorio y debe ser válido.");

        var cliente = await _clientes.GetByIdAsync(request.ClienteId, ct)
            ?? throw new NotFoundException($"El cliente {request.ClienteId} no existe.");

        if (!cliente.Activo)
            throw new BusinessRuleException($"El cliente {request.ClienteId} está dado de baja.");

        var patenteDuplicada = await _vehiculos.AnyAsync(v => v.Patente == patente, ct);
        if (patenteDuplicada)
            throw new BusinessRuleException($"Ya existe un vehículo registrado con la patente '{patente}' (RN03).");

        var vehiculo = new Vehiculo
        {
            Id = Guid.NewGuid(),
            ClienteId = cliente.Id,
            Patente = patente,
            Marca = request.Marca.Trim(),
            Modelo = request.Modelo.Trim(),
            Anio = request.Anio.Value,
            Tipo = request.Tipo.Value,
            Uso = request.Uso.Value,
            NumeroMotor = request.NumeroMotor.Trim(),
            NumeroChasis = request.NumeroChasis.Trim(),
            ValidadoDnrpa = false,
            Activo = true
        };

        await _vehiculos.AddAsync(vehiculo, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        return Mapear(vehiculo);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<VehiculoResponse>> ListarPorClienteAsync(Guid clienteId, CancellationToken ct = default)
    {
        var vehiculosActivos = await _vehiculos.FindAsync(v => v.ClienteId == clienteId && v.Activo, ct);
        return vehiculosActivos
            .OrderBy(v => v.Patente, StringComparer.Ordinal)
            .Select(Mapear)
            .ToList();
    }

    /// <inheritdoc />
    public async Task<VehiculoResponse> ObtenerAsync(Guid id, CancellationToken ct = default)
    {
        var vehiculo = await _vehiculos.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"El vehículo {id} no existe.");

        return Mapear(vehiculo);
    }

    /// <inheritdoc />
    public async Task<VehiculoResponse> ModificarUsoAsync(Guid id, UsoVehiculo uso, CancellationToken ct = default)
    {
        if (!Enum.IsDefined(uso))
            throw new BusinessRuleException("El uso del vehículo no es válido.");

        var vehiculo = await _vehiculos.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"El vehículo {id} no existe.");

        if (!vehiculo.Activo)
            throw new BusinessRuleException($"El vehículo {id} está dado de baja y no puede modificarse.");

        vehiculo.Uso = uso;
        _vehiculos.Update(vehiculo);
        await _unitOfWork.SaveChangesAsync(ct);

        return Mapear(vehiculo);
    }

    /// <inheritdoc />
    public async Task DarDeBajaAsync(Guid id, CancellationToken ct = default)
    {
        var vehiculo = await _vehiculos.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"El vehículo {id} no existe.");

        // Idempotent: deactivating an already deactivated vehicle is a no-op.
        if (!vehiculo.Activo)
            return;

        var tienePolizaActiva = await _polizas.AnyAsync(
            p => p.VehiculoId == id
                && (p.Estado == EstadoPoliza.Pendiente
                    || p.Estado == EstadoPoliza.Vigente
                    || p.Estado == EstadoPoliza.Suspendida),
            ct);
        if (tienePolizaActiva)
            throw new BusinessRuleException(
                $"El vehículo {id} tiene una póliza activa (Pendiente, Vigente o Suspendida) y no puede darse de baja (RN04).");

        vehiculo.Activo = false;
        _vehiculos.Update(vehiculo);
        await _unitOfWork.SaveChangesAsync(ct);
    }

    private static VehiculoResponse Mapear(Vehiculo vehiculo) => new(
        Id: vehiculo.Id,
        ClienteId: vehiculo.ClienteId,
        Patente: vehiculo.Patente,
        Marca: vehiculo.Marca,
        Modelo: vehiculo.Modelo,
        Anio: vehiculo.Anio,
        Tipo: vehiculo.Tipo,
        Uso: vehiculo.Uso,
        ValidadoDnrpa: vehiculo.ValidadoDnrpa,
        Activo: vehiculo.Activo);
}
