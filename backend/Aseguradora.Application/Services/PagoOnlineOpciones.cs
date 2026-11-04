using System.ComponentModel.DataAnnotations;

namespace Aseguradora.Application.Services;

/// <summary>Configuración del pago online con pasarela (CU15), validada al iniciar la API.</summary>
public sealed class PagoOnlineOpciones
{
    /// <summary>Sección de configuración.</summary>
    public const string Seccion = "Pagos";

    /// <summary>URL pública de la API; la pasarela notifica en <c>{UrlBaseApi}/api/webhooks/pasarela/{proveedor}</c>.</summary>
    [Required(ErrorMessage = "Configure Pagos:UrlBaseApi.")]
    [Url(ErrorMessage = "Pagos:UrlBaseApi debe ser una URL absoluta.")]
    public string UrlBaseApi { get; set; } = "";

    /// <summary>Página de la web pública a la que vuelve el cliente tras pagar.</summary>
    [Required(ErrorMessage = "Configure Pagos:UrlRetornoExito.")]
    [Url(ErrorMessage = "Pagos:UrlRetornoExito debe ser una URL absoluta.")]
    public string UrlRetornoExito { get; set; } = "";

    /// <summary>Página de la web pública a la que vuelve el cliente si el pago falla o se cancela.</summary>
    [Required(ErrorMessage = "Configure Pagos:UrlRetornoError.")]
    [Url(ErrorMessage = "Pagos:UrlRetornoError debe ser una URL absoluta.")]
    public string UrlRetornoError { get; set; } = "";

    /// <summary>
    /// Minutos durante los que una cuota con un pago pendiente no admite otro pago online (C8).
    /// Pasado ese plazo la cuota vuelve a poder pagarse.
    /// </summary>
    [Range(1, 1440, ErrorMessage = "Pagos:ReservaMinutos debe estar entre 1 y 1440.")]
    public int ReservaMinutos { get; set; } = 60;
}
