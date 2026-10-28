using Aseguradora.Domain.Entities;

namespace Aseguradora.Tests.Builders;

/// <summary>
/// A client that is an adult with a unique DNI and email (RN01). The DNI range stays away from the
/// seeded client (30123456).
/// </summary>
public sealed class ClienteBuilder : TestBuilder<Cliente, ClienteBuilder>
{
    private const int PrimerDni = 40_000_000;

    public ClienteBuilder ConDni(string dni)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(dni);
        return Con(cliente => cliente.Dni = dni);
    }

    protected override Cliente CrearPorDefecto() => new()
    {
        Id = Guid.NewGuid(),
        Dni = (PrimerDni + Secuencia).ToString(),
        Cuil = $"20{PrimerDni + Secuencia}5",
        Nombre = "Ana",
        Apellido = "Gómez",
        FechaNacimiento = new DateOnly(1990, 1, 15),
        Sexo = 'F',
        Email = $"cliente{Secuencia}@example.com",
        Calle = "Avenida Mitre",
        Numero = "100",
        Localidad = "San Miguel de Tucumán",
        Provincia = "Tucumán",
        CodigoPostal = "4000",
        ValidadoRenaper = true,
        FechaValidacionRenaper = new DateTime(2026, 10, 15, 0, 0, 0, DateTimeKind.Utc),
        Activo = true
    };
}
