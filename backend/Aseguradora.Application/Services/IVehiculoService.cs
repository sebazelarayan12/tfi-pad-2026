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
}
