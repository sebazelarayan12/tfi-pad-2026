namespace Aseguradora.Domain.Entities;

public class RendicionPagoFacil : EntityBase
{
    /// <summary>Unique: the same settlement file is never processed twice.</summary>
    public string NombreArchivo { get; set; } = string.Empty;
    public DateOnly FechaRendicion { get; set; }
    public int CantidadRegistros { get; set; }
    public decimal ImporteTotal { get; set; }
    public DateTime FechaProceso { get; set; }

    public ICollection<Pago> Pagos { get; set; } = new List<Pago>();
}
