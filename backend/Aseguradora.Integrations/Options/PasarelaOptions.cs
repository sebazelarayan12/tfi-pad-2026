using System.ComponentModel.DataAnnotations;
namespace Aseguradora.Integrations.Options;
/// <summary>Configuración de un proveedor de pasarela de pagos (mock o cliente HTTP).</summary>
public class PasarelaOptions
{
    /// <summary>Selecciona el mock en memoria en lugar del cliente HTTP.</summary>
    public bool UsarMock { get; set; } = true;
    /// <summary>Confirma estado e importe consultando la pasarela antes de aplicar el aviso.</summary>
    public bool ConfirmarWebhook { get; set; } = true;
    [Url] public string? BaseUrl { get; set; }
    /// <summary>Credencial suministrada por variable de entorno.</summary>
    public string? ApiKey { get; set; }
}
