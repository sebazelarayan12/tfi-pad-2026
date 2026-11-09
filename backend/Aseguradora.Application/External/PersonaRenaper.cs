namespace Aseguradora.Application.External;

/// <summary>
/// Person data returned by Renaper (CU04, RN02, contract 9.1). The fields overwrite what the
/// employee typed when the person is alive (RN02).
/// </summary>
/// <remarks>
/// OpenRENAPER publishes only name, DNI, CUIT, age, sex and province, and any of them may be missing.
/// Whatever the source does not publish is <see langword="null"/> and is never inferred: the data the
/// employee typed stays in place (see <c>ClienteService</c>). The source does not report deaths, so
/// <see cref="Estado"/> is <see cref="EstadoRenaper.Vigente"/> unless the source says otherwise.
/// </remarks>
/// <param name="Dni">Document number.</param>
/// <param name="Cuil">CUIL assigned to the person, when published.</param>
/// <param name="Nombre">Name as published (the real source returns first and last name in one string).</param>
/// <param name="Apellido">Last name, when the source gives it apart from the name.</param>
/// <param name="FechaNacimiento">Birth date, when published.</param>
/// <param name="Sexo">Sex as one character (M/F), when published.</param>
/// <param name="Domicilio">Registered address, when published.</param>
/// <param name="Estado">Whether the person is alive or deceased (RN02).</param>
/// <param name="FechaFallecimiento">Death date, present only when <paramref name="Estado"/> is deceased.</param>
/// <param name="Edad">Age in years, when the source publishes it instead of a birth date (RN01).</param>
public sealed record PersonaRenaper(
    string Dni,
    string? Cuil,
    string Nombre,
    string? Apellido,
    DateOnly? FechaNacimiento,
    char? Sexo,
    DomicilioRenaper? Domicilio,
    EstadoRenaper Estado,
    DateOnly? FechaFallecimiento,
    int? Edad = null);

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
