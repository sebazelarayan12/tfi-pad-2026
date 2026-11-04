namespace Aseguradora.Application.External;

/// <summary>
/// Person data returned by Renaper (CU04, RN02, contract 9.1). The fields overwrite what the
/// employee typed when the person is alive (RN02).
/// </summary>
/// <param name="Dni">Document number.</param>
/// <param name="Cuil">CUIL assigned to the person.</param>
/// <param name="Nombre">First name.</param>
/// <param name="Apellido">Last name.</param>
/// <param name="FechaNacimiento">Birth date, needed for the minimum age check (RN01).</param>
/// <param name="Sexo">Sex as one character (M/F).</param>
/// <param name="Domicilio">Registered address.</param>
/// <param name="Estado">Whether the person is alive or deceased (RN02).</param>
/// <param name="FechaFallecimiento">Death date, present only when <paramref name="Estado"/> is deceased.</param>
public sealed record PersonaRenaper(
    string Dni,
    string Cuil,
    string Nombre,
    string Apellido,
    DateOnly FechaNacimiento,
    char Sexo,
    DomicilioRenaper Domicilio,
    EstadoRenaper Estado,
    DateOnly? FechaFallecimiento);

/// <summary>Address returned by Renaper. Floor and unit are optional.</summary>
/// <param name="Calle">Street name.</param>
/// <param name="Numero">Street number.</param>
/// <param name="Piso">Floor, when the address has one.</param>
/// <param name="Depto">Unit, when the address has one.</param>
/// <param name="Localidad">City or town.</param>
/// <param name="Provincia">Province.</param>
/// <param name="CodigoPostal">Postal code.</param>
public sealed record DomicilioRenaper(
    string Calle,
    string Numero,
    string? Piso,
    string? Depto,
    string Localidad,
    string Provincia,
    string CodigoPostal);

/// <summary>Vital state reported by Renaper. A deceased person cannot be insured (RN02).</summary>
public enum EstadoRenaper
{
    /// <summary>The person is alive and can be insured.</summary>
    Vigente,

    /// <summary>The person is deceased and cannot be insured.</summary>
    Fallecido
}
