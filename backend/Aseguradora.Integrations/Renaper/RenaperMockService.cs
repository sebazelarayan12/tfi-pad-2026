using Aseguradora.Application.External;

namespace Aseguradora.Integrations.Renaper;

/// <summary>
/// Deterministic in-memory mock of <see cref="IRenaperService"/> with fixed test people
/// (CU04, RN02). Used when <c>Integraciones:Renaper:UsarMock</c> is <see langword="true"/>,
/// so the team can work without waiting for the other group's API.
/// </summary>
public sealed class RenaperMockService : IRenaperService
{
    private static readonly IReadOnlyDictionary<string, PersonaRenaper> Personas =
        new Dictionary<string, PersonaRenaper>(StringComparer.Ordinal)
        {
            // Same data as the seeded client, so the alta of F1-05 matches what the employee sees.
            ["30123456"] = new PersonaRenaper(
                Dni: "30123456",
                Cuil: "20301234565",
                Nombre: "Juan Carlos",
                Apellido: "Pérez",
                FechaNacimiento: new DateOnly(1985, 3, 21),
                Sexo: 'M',
                Domicilio: new DomicilioRenaper(
                    Calle: "San Martín",
                    Numero: "1234",
                    Piso: null,
                    Depto: null,
                    Localidad: "San Miguel de Tucumán",
                    Provincia: "Tucumán",
                    CodigoPostal: "4000"),
                Estado: EstadoRenaper.Vigente,
                FechaFallecimiento: null),

            // Alive and under 18: lets the alta tests exercise the minimum age rule (RN01).
            ["45123456"] = new PersonaRenaper(
                Dni: "45123456",
                Cuil: "27451234564",
                Nombre: "Lucía",
                Apellido: "Fernández",
                FechaNacimiento: new DateOnly(2010, 7, 12),
                Sexo: 'F',
                Domicilio: new DomicilioRenaper(
                    Calle: "Rivadavia",
                    Numero: "456",
                    Piso: "2",
                    Depto: "B",
                    Localidad: "Yerba Buena",
                    Provincia: "Tucumán",
                    CodigoPostal: "4107"),
                Estado: EstadoRenaper.Vigente,
                FechaFallecimiento: null),

            // Deceased: the alta must reject it (RN02).
            ["20111222"] = new PersonaRenaper(
                Dni: "20111222",
                Cuil: "20201112223",
                Nombre: "Roberto Carlos",
                Apellido: "Sosa",
                FechaNacimiento: new DateOnly(1950, 1, 30),
                Sexo: 'M',
                Domicilio: new DomicilioRenaper(
                    Calle: "Belgrano",
                    Numero: "789",
                    Piso: null,
                    Depto: null,
                    Localidad: "Concepción",
                    Provincia: "Tucumán",
                    CodigoPostal: "4146"),
                Estado: EstadoRenaper.Fallecido,
                FechaFallecimiento: new DateOnly(2024, 11, 2))
        };

    /// <inheritdoc />
    public Task<PersonaRenaper?> ObtenerPorDniAsync(string dni, CancellationToken ct = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(dni);

        Personas.TryGetValue(dni.Trim(), out var persona);
        return Task.FromResult(persona);
    }
}
