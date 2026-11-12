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

    /// <summary>
    /// Cliente HTTP que se usa cuando <see cref="UsarMock"/> es <c>false</c>: <see cref="TiposPasarela.Contrato93"/>
    /// (por defecto) o <see cref="TiposPasarela.Padi"/>, que solo admite <c>pasarela1</c>.
    /// </summary>
    [RegularExpression($"^({TiposPasarela.Contrato93}|{TiposPasarela.Padi})$",
        ErrorMessage = "Tipo debe ser Contrato93 o Padi.")]
    public string Tipo { get; set; } = TiposPasarela.Contrato93;

    /// <summary>Secreto con el que PADI firma sus avisos (HMAC-SHA256). Solo se usa con <see cref="TiposPasarela.Padi"/>.</summary>
    public string? WebhookSecret { get; set; }

    /// <summary>
    /// Minutos de vida del link de PADI. Si no se configura, vale <c>Pagos:ReservaMinutos - 10</c>, para que
    /// el link venza antes que la reserva de las cuotas.
    /// </summary>
    [Range(1, 1440)]
    public int? TtlMinutos { get; set; }
}

/// <summary>Valores admitidos por <see cref="PasarelaOptions.Tipo"/>.</summary>
public static class TiposPasarela
{
    /// <summary>Contrato 9.3 entre grupos (<c>POST /api/pagos</c>).</summary>
    public const string Contrato93 = "Contrato93";
    /// <summary>API de comercios de PADI (links de pago).</summary>
    public const string Padi = "Padi";
}
