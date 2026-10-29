using Aseguradora.Domain.Enums;

namespace Aseguradora.Application.Dtos;

/// <summary>
/// Read representation of a registered vehicle (CU06, CU07).
/// </summary>
/// <param name="Id">Unique identifier of the vehicle.</param>
/// <param name="ClienteId">Identifier of the client who owns the vehicle.</param>
/// <param name="Patente">License plate in uppercase.</param>
/// <param name="Marca">Vehicle brand returned by DNRPA.</param>
/// <param name="Modelo">Vehicle model returned by DNRPA.</param>
/// <param name="Anio">Manufacturing year returned by DNRPA.</param>
/// <param name="Tipo">Vehicle category (<see cref="TipoVehiculo"/>) returned by DNRPA.</param>
/// <param name="Uso">Declared use of the vehicle (<see cref="UsoVehiculo"/>).</param>
/// <param name="ValidadoDnrpa">Indicates whether the vehicle ownership was validated against DNRPA (RN03).</param>
/// <param name="Activo">Indicates whether the vehicle is active (RN15).</param>
public sealed record VehiculoResponse(
    Guid Id,
    Guid ClienteId,
    string Patente,
    string Marca,
    string Modelo,
    int Anio,
    TipoVehiculo Tipo,
    UsoVehiculo Uso,
    bool ValidadoDnrpa,
    bool Activo);
