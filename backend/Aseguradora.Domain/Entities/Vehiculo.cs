using Aseguradora.Domain.Enums;

namespace Aseguradora.Domain.Entities;

public class Vehiculo : EntityBase
{
    public Guid ClienteId { get; set; }
    public string Patente { get; set; } = string.Empty;
    public string Marca { get; set; } = string.Empty;
    public string Modelo { get; set; } = string.Empty;
    public int Anio { get; set; }
    public TipoVehiculo Tipo { get; set; }
    public UsoVehiculo Uso { get; set; }
    public string NumeroMotor { get; set; } = string.Empty;
    public string NumeroChasis { get; set; } = string.Empty;
    public bool ValidadoDnrpa { get; set; }
    public bool Activo { get; set; } = true;

    public Cliente Cliente { get; set; } = null!;
    public ICollection<Poliza> Polizas { get; set; } = new List<Poliza>();
}
