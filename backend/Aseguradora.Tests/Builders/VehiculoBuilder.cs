using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;

namespace Aseguradora.Tests.Builders;

/// <summary>
/// A vehicle validated in DNRPA with a unique patente (RN03). Patentes use the form ZA000AA, so they
/// never collide with the seeded vehicle (AB123CD).
/// </summary>
public sealed class VehiculoBuilder : TestBuilder<Vehiculo, VehiculoBuilder>
{
    private const int Letras = 26;
    private const int Digitos = 1000;

    public VehiculoBuilder ConPatente(string patente)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(patente);
        return Con(vehiculo => vehiculo.Patente = patente);
    }

    public VehiculoBuilder DeCliente(Cliente cliente)
    {
        ArgumentNullException.ThrowIfNull(cliente);
        return Con(vehiculo =>
        {
            vehiculo.ClienteId = cliente.Id;
            vehiculo.Cliente = cliente;
        });
    }

    protected override Vehiculo CrearPorDefecto() => new()
    {
        Id = Guid.NewGuid(),
        ClienteId = Guid.NewGuid(),
        Patente = PatenteUnica(),
        Marca = "Toyota",
        Modelo = "Corolla",
        Anio = 2020,
        Tipo = TipoVehiculo.Auto,
        Uso = UsoVehiculo.Particular,
        NumeroMotor = $"MOT{Secuencia:D8}",
        NumeroChasis = $"CHA{Secuencia:D8}",
        ValidadoDnrpa = true,
        Activo = true
    };

    private string PatenteUnica()
    {
        var primera = (char)('Z' - Secuencia / (Digitos * Letras) % Letras);
        var segunda = (char)('A' + Secuencia / Digitos % Letras);
        return $"{primera}{segunda}{Secuencia % Digitos:D3}AA";
    }
}
