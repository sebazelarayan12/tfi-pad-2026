namespace Aseguradora.Domain.Entities;

public class Cliente : EntityBase
{
    public string Dni { get; set; } = string.Empty;
    public string Cuil { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Apellido { get; set; } = string.Empty;
    public DateOnly FechaNacimiento { get; set; }
    public char Sexo { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? Telefono { get; set; }
    public string Calle { get; set; } = string.Empty;
    public string Numero { get; set; } = string.Empty;
    public string Localidad { get; set; } = string.Empty;
    public string Provincia { get; set; } = string.Empty;
    public string CodigoPostal { get; set; } = string.Empty;
    public bool ValidadoRenaper { get; set; }
    public DateTime? FechaValidacionRenaper { get; set; }
    public bool Activo { get; set; } = true;

    public ICollection<Vehiculo> Vehiculos { get; set; } = new List<Vehiculo>();
    public ICollection<Poliza> Polizas { get; set; } = new List<Poliza>();
    public ICollection<Pago> Pagos { get; set; } = new List<Pago>();
}
