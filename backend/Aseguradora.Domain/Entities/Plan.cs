namespace Aseguradora.Domain.Entities;

public class Plan : EntityBase
{
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public decimal PrimaBase { get; set; }

    /// <summary>Allowed vehicle types, comma separated (e.g. "Auto,Camioneta").</summary>
    public string TiposPermitidos { get; set; } = string.Empty;

    /// <summary>Maximum vehicle age in years; null means no limit.</summary>
    public int? AntiguedadMaxima { get; set; }

    public bool Activo { get; set; } = true;

    public ICollection<Poliza> Polizas { get; set; } = new List<Poliza>();
    public ICollection<Cotizacion> Cotizaciones { get; set; } = new List<Cotizacion>();
}
