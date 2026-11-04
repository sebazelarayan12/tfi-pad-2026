using Aseguradora.Domain.Enums;
using Aseguradora.Application.Dtos;
using Aseguradora.Application.Exceptions;

namespace Aseguradora.Application.Services;

/// <summary>
/// Service contract for registering and managing client vehicles (CU06, CU07, RN03).
/// </summary>
public interface IVehiculoService
{
    /// <summary>
    /// Registers a new vehicle for a client after validating the license plate format, uniqueness,
    /// DNRPA registration, and owner DNI match (CU06, RN03).
    /// </summary>
    /// <param name="request">Vehicle registration request.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>The persisted <see cref="VehiculoResponse"/> with <c>ValidadoDnrpa = true</c>.</returns>
    /// <exception cref="NotFoundException">Thrown when the specified client does not exist.</exception>
    /// <exception cref="BusinessRuleException">Thrown when the client is inactive, the plate format is invalid, the plate is duplicated, the vehicle is not found in DNRPA, or the DNRPA owner DNI does not match the client's DNI.</exception>
    /// <exception cref="ExternalServiceException">Thrown when the DNRPA service fails or times out.</exception>
    Task<VehiculoResponse> AltaAsync(VehiculoAltaRequest request, CancellationToken ct = default);

    /// <summary>Lists the active vehicles of a client (CU07, RN15).</summary>
    Task<IReadOnlyList<VehiculoResponse>> ListarPorClienteAsync(Guid clienteId, CancellationToken ct = default);

    /// <summary>Gets a vehicle by id. Deactivated vehicles are returned with <c>Activo = false</c>.</summary>
    /// <exception cref="NotFoundException">Thrown when the vehicle does not exist.</exception>
    Task<VehiculoResponse> ObtenerAsync(Guid id, CancellationToken ct = default);

    /// <summary>Changes the declared use of a vehicle; it is the only editable field (CU07).</summary>
    /// <exception cref="NotFoundException">Thrown when the vehicle does not exist.</exception>
    /// <exception cref="BusinessRuleException">Thrown when the use is not a defined value or the vehicle is deactivated.</exception>
    Task<VehiculoResponse> ModificarUsoAsync(Guid id, UsoVehiculo uso, CancellationToken ct = default);

    /// <summary>Soft-deletes a vehicle that has no Pendiente, Vigente or Suspendida policy (RN04, RN15). Idempotent: an already deactivated vehicle is left as is.</summary>
    /// <exception cref="NotFoundException">Thrown when the vehicle does not exist.</exception>
    /// <exception cref="BusinessRuleException">Thrown when the vehicle has an active policy.</exception>
    Task DarDeBajaAsync(Guid id, CancellationToken ct = default);
}
