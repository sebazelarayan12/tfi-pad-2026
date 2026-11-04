namespace Aseguradora.Application.Clientes.DTOs;

/// <summary>
/// Read representation of a client (CU04, CU05). The contract published by F1-05 for the other fronts.
/// </summary>
/// <param name="Id">Unique identifier of the client.</param>
/// <param name="Dni">Document number.</param>
/// <param name="Cuil">CUIL assigned to the person.</param>
/// <param name="Nombre">First name.</param>
/// <param name="Apellido">Last name.</param>
/// <param name="FechaNacimiento">Birth date.</param>
/// <param name="Sexo">Sex as one character (<c>M</c>, <c>F</c> or <c>X</c>).</param>
/// <param name="Email">Unique email of the client (RN01).</param>
/// <param name="Telefono">Contact phone, when present.</param>
/// <param name="Calle">Street of the client's address.</param>
/// <param name="Numero">Street number of the client's address.</param>
/// <param name="Localidad">City or town of the client's address.</param>
/// <param name="Provincia">Province of the client's address.</param>
/// <param name="CodigoPostal">Postal code of the client's address.</param>
/// <param name="ValidadoRenaper">Whether Renaper validated the person (RN02).</param>
/// <param name="FechaValidacionRenaper">UTC instant of the last successful Renaper validation (RN16).</param>
/// <param name="Activo">Whether the client is active (RN15).</param>
public sealed record ClienteResponse(
    Guid Id,
    string Dni,
    string Cuil,
    string Nombre,
    string Apellido,
    DateOnly FechaNacimiento,
    char Sexo,
    string Email,
    string? Telefono,
    string Calle,
    string Numero,
    string Localidad,
    string Provincia,
    string CodigoPostal,
    bool ValidadoRenaper,
    DateTime? FechaValidacionRenaper,
    bool Activo);
