using System.ComponentModel.DataAnnotations;
namespace Aseguradora.Application.Services;
/// <summary>Datos fiscales obligatorios, validados al iniciar la API.</summary>
public sealed class FacturacionOpciones
{
    /// <summary>Constructor para el enlace de configuración.</summary>
    public FacturacionOpciones() { }
    /// <summary>Permite proporcionar explícitamente datos fiscales de prueba.</summary>
    public FacturacionOpciones(string cuit, int puntoVenta) { Cuit = cuit; PuntoVenta = puntoVenta; }
    /// <summary>CUIT del emisor.</summary>
    [Required(ErrorMessage = "Configure Facturacion:Cuit.")]
    public string Cuit { get; set; } = "";
    /// <summary>Punto de venta del emisor.</summary>
    [Range(1, int.MaxValue, ErrorMessage = "Facturacion:PuntoVenta debe ser mayor que cero.")]
    public int PuntoVenta { get; set; }
}
