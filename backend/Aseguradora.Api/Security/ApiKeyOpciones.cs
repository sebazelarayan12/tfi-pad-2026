namespace Aseguradora.Api.Security;

/// <summary>
/// API keys for external systems, mapped by provider name (for example <c>pasarela1</c>).
/// They come from <c>ApiKeys__&lt;proveedor&gt;</c> environment variables, never from
/// <c>appsettings.json</c>.
/// </summary>
public sealed class ApiKeyOpciones
{
    public const string Seccion = "ApiKeys";

    public Dictionary<string, string> ApiKeys { get; set; } = new(StringComparer.Ordinal);
}
