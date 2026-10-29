using Aseguradora.Domain.Enums;

namespace Aseguradora.Application.Dtos;

/// <summary>
/// Application-layer request to quote a vehicle for an external system without a registered client (CU09, contract 9.5 C).
/// Free of serialization attributes; HTTP-specific formatting belongs to the API layer.
/// </summary>
/// <param name="TipoVehiculo">Vehicle category (Auto, Moto, Camioneta).</param>
/// <param name="Anio">Manufacturing year of the vehicle.</param>
/// <param name="Uso">Declared use of the vehicle (Particular, Comercial).</param>
/// <param name="EdadConductor">Age of the primary driver in years.</param>
public sealed record CotizacionExternaRequest(
    TipoVehiculo TipoVehiculo,
    int Anio,
    UsoVehiculo Uso,
    int EdadConductor);
