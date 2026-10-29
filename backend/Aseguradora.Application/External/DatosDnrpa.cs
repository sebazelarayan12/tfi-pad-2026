using Aseguradora.Domain.Enums;

namespace Aseguradora.Application.External;

/// <summary>
/// Vehicle and registered owner data returned by the DNRPA service (CU06, RN03, contract 9.4).
/// </summary>
/// <param name="Patente">Vehicle license plate in uppercase (e.g., AB123CD).</param>
/// <param name="Marca">Vehicle brand (e.g., Toyota).</param>
/// <param name="Modelo">Vehicle model (e.g., Corolla XEi).</param>
/// <param name="Anio">Manufacturing year of the vehicle.</param>
/// <param name="Tipo">Vehicle category (<see cref="TipoVehiculo"/>).</param>
/// <param name="NumeroMotor">Engine serial number.</param>
/// <param name="NumeroChasis">Chassis / VIN serial number.</param>
/// <param name="TitularDni">DNI of the registered owner in DNRPA (RN03).</param>
/// <param name="TitularNombre">Full name of the registered owner in DNRPA.</param>
public sealed record DatosDnrpa(
    string Patente,
    string Marca,
    string Modelo,
    int Anio,
    TipoVehiculo Tipo,
    string NumeroMotor,
    string NumeroChasis,
    string TitularDni,
    string TitularNombre);
