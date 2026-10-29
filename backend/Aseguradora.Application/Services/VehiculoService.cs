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
    IDnrpaService dnrpa,
    IUnitOfWork unitOfWork) : IVehiculoService
{
    /// <summary>Error code included when DNRPA does not know the requested license plate (section 9.4).</summary>
    public const string CodigoVehiculoNoEncontrado = "VEHICULO_NO_ENCONTRADO";

    private readonly IRepository<Vehiculo> _vehiculos = vehiculos ?? throw new ArgumentNullException(nameof(vehiculos));
    private readonly IRepository<Cliente> _clientes = clientes ?? throw new ArgumentNullException(nameof(clientes));
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
