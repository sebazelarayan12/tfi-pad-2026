namespace Aseguradora.Application.Clientes.DTOs;

/// <summary>
/// Person data returned by Renaper for the pre-load preview (CU04, contract 9.1).
/// </summary>
/// <param name="Dni">Document number.</param>
/// <param name="Cuil">CUIL assigned to the person.</param>
/// <param name="Nombre">First name.</param>
/// <param name="Apellido">Last name.</param>
/// <param name="FechaNacimiento">Birth date.</param>
/// <param name="Sexo">Sex as one character (<c>M</c>, <c>F</c> or <c>X</c>).</param>
/// <param name="Domicilio">Registered address.</param>
/// <param name="Estado">Vital state, <c>VIGENTE</c> or <c>FALLECIDO</c> (RN02).</param>
/// <param name="FechaFallecimiento">Death date, present only when the person is deceased.</param>
public sealed record PersonaRenaperResponse(
    string Dni,
    string Cuil,
    string Nombre,
    string Apellido,
    DateOnly FechaNacimiento,
    char Sexo,
    DomicilioRenaperResponse Domicilio,
    string Estado,
    DateOnly? FechaFallecimiento);

/// <summary>Address returned by Renaper. Floor and unit are optional (contract 9.1).</summary>
/// <param name="Calle">Street name.</param>
/// <param name="Numero">Street number.</param>
/// <param name="Piso">Floor, when the address has one.</param>
/// <param name="Depto">Unit, when the address has one.</param>
/// <param name="Localidad">City or town.</param>
/// <param name="Provincia">Province.</param>
/// <param name="CodigoPostal">Postal code.</param>
public sealed record DomicilioRenaperResponse(
    string Calle,
    string Numero,
    string? Piso,
    string? Depto,
    string Localidad,
    string Provincia,
    string CodigoPostal);
