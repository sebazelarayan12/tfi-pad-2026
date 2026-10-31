namespace Aseguradora.Application.Services;

/// <summary>Exclusión por identificador externo, compartida entre instancias de la API.</summary>
public interface IExclusionWebhook
{
    /// <summary>Adquiere una exclusión que se libera al disponer el resultado.</summary>
    Task<IAsyncDisposable> AdquirirAsync(string clave, CancellationToken ct);
}
