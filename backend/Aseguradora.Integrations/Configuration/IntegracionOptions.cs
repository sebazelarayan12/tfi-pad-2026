using System.ComponentModel.DataAnnotations;

namespace Aseguradora.Integrations.Configuration;

/// <summary>
/// Configuration of one external integration. A service with extra settings (for example Frente 4's
/// confirmarWebhook) inherits from this class in its own project; the base key does not change.
/// The section is <c>Integraciones:&lt;Servicio&gt;</c>.
/// </summary>
public class IntegracionOptions
{
    /// <summary>Prefix of every integration section in configuration.</summary>
    public const string Prefix = "Integraciones";

    /// <summary>Selector: <c>true</c> registers the mock, <c>false</c> the real HTTP client.</summary>
    public bool UsarMock { get; set; } = true;

    /// <summary>Base address of the other group. Required when <see cref="UsarMock"/> is <c>false</c>.</summary>
    public string? BaseUrl { get; set; }

    /// <summary>Key sent in the <c>X-Api-Key</c> header. Required when <see cref="UsarMock"/> is <c>false</c>.</summary>
    public string? ApiKey { get; set; }

    /// <summary>Timeout of one attempt, in seconds.</summary>
    [Range(1, 300)]
    public int TimeoutSegundos { get; set; } = 10;

    /// <summary>Retries after the first attempt. Zero means a single attempt.</summary>
    [Range(0, 10)]
    public int ReintentosMaximos { get; set; } = 2;

    /// <summary>Full configuration key of an integration, for example <c>Integraciones:Renaper</c>.</summary>
    public static string Seccion(string nombre) => $"{Prefix}:{nombre}";
}
