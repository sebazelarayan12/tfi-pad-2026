using System.ComponentModel.DataAnnotations;
namespace Aseguradora.Integrations.Options;
/// <summary>Define ArcaOptions para la integración de pagos y facturación.</summary>
public class ArcaOptions
{
    /// <summary>Selecciona el mock en memoria en lugar del cliente HTTP.</summary>
    public bool UsarMock { get; set; } = true;
    [Url] public string? BaseUrl { get; set; }
    /// <summary>Credencial suministrada por variable de entorno.</summary>
    public string? ApiKey { get; set; }
}
