using Aseguradora.Application.External;
using Aseguradora.Domain.Enums;

namespace Aseguradora.Integrations.Dnrpa;

/// <summary>
/// Deterministic in-memory mock of <see cref="IDnrpaService"/> with fixed test vehicles (CU06, RN03).
/// Used when <c>Integraciones:Dnrpa:UsarMock</c> is <see langword="true"/>.
/// </summary>
public sealed class DnrpaMockService : IDnrpaService
{
    private static readonly IReadOnlyDictionary<string, DatosDnrpa> Vehiculos =
        new Dictionary<string, DatosDnrpa>(StringComparer.OrdinalIgnoreCase)
        {
            ["AB123CD"] = new DatosDnrpa(
                Patente: "AB123CD",
                Marca: "Toyota",
                Modelo: "Corolla XEi",
                Anio: 2021,
                Tipo: TipoVehiculo.Auto,
                NumeroMotor: "2ZR1234567",
                NumeroChasis: "9BRBL3HE5M0123456",
                TitularDni: "30123456",
                TitularNombre: "Juan Carlos Pérez"),
            ["AE789FG"] = new DatosDnrpa(
                Patente: "AE789FG",
                Marca: "Toyota",
                Modelo: "Hilux SRX",
                Anio: 2023,
                Tipo: TipoVehiculo.Camioneta,
                NumeroMotor: "1GD7654321",
                NumeroChasis: "8AJBA3CD2P0789123",
                TitularDni: "30123456",
                TitularNombre: "Juan Carlos Pérez"),
            ["AC456EF"] = new DatosDnrpa(
                Patente: "AC456EF",
                Marca: "Honda",
                Modelo: "CB250 Twister",
                Anio: 2022,
                Tipo: TipoVehiculo.Moto,
                NumeroMotor: "MC49E2012345",
                NumeroChasis: "9C2MC4900NR456789",
                TitularDni: "27111222",
                TitularNombre: "María Laura Gómez")
        };

    /// <inheritdoc />
    public Task<DatosDnrpa?> ObtenerVehiculoAsync(string patente, CancellationToken ct = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(patente);

        var normalizada = patente.Trim().ToUpperInvariant();
        Vehiculos.TryGetValue(normalizada, out var datos);
        return Task.FromResult(datos);
    }
}
