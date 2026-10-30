using Aseguradora.Application.Dtos;
using Aseguradora.Application.Exceptions;
using Aseguradora.Application.External;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Domain.Interfaces;

namespace Aseguradora.Application.Services;

/// <summary>
/// Handles vehicle registration and validation against DNRPA (CU06, RN03).
/// </summary>
public sealed class VehiculoService(
    IRepository<Vehiculo> vehiculos,
    IRepository<Cliente> clientes,
    IRepository<Poliza> polizas,
    IDnrpaService dnrpa,
    IUnitOfWork unitOfWork) : IVehiculoService
{
    /// <summary>Error code included when DNRPA does not know the requested license plate (section 9.4).</summary>
    public const string CodigoVehiculoNoEncontrado = "VEHICULO_NO_ENCONTRADO";

    private readonly IRepository<Vehiculo> _vehiculos = vehiculos ?? throw new ArgumentNullException(nameof(vehiculos));
    private readonly IRepository<Cliente> _clientes = clientes ?? throw new ArgumentNullException(nameof(clientes));
    private readonly IRepository<Poliza> _polizas = polizas ?? throw new ArgumentNullException(nameof(polizas));
    private readonly IDnrpaService _dnrpa = dnrpa ?? throw new ArgumentNullException(nameof(dnrpa));
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

        var cliente = await _clientes.GetByIdAsync(request.ClienteId, ct)
            ?? throw new NotFoundException($"El cliente {request.ClienteId} no existe.");

        if (!cliente.Activo)
            throw new BusinessRuleException($"El cliente {request.ClienteId} está dado de baja.");

        var patenteDuplicada = await _vehiculos.AnyAsync(v => v.Patente == patente, ct);
        if (patenteDuplicada)
            throw new BusinessRuleException($"Ya existe un vehículo registrado con la patente '{patente}' (RN03).");

        var datosDnrpa = await _dnrpa.ObtenerVehiculoAsync(patente, ct)
            ?? throw new BusinessRuleException($"{CodigoVehiculoNoEncontrado}: La patente '{patente}' no figura en el registro de DNRPA.");

        if (!string.Equals(datosDnrpa.TitularDni, cliente.Dni, StringComparison.Ordinal))
            throw new BusinessRuleException(
                $"RN03: El titular registral en DNRPA (DNI {datosDnrpa.TitularDni}) no coincide con el DNI del cliente ({cliente.Dni}).");

        var vehiculo = new Vehiculo
        {
            Id = Guid.NewGuid(),
            ClienteId = cliente.Id,
            Patente = patente,
            Marca = datosDnrpa.Marca,
            Modelo = datosDnrpa.Modelo,
            Anio = datosDnrpa.Anio,
            Tipo = datosDnrpa.Tipo,
            Uso = request.Uso.Value,
            NumeroMotor = datosDnrpa.NumeroMotor,
            NumeroChasis = datosDnrpa.NumeroChasis,
            ValidadoDnrpa = true,
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
