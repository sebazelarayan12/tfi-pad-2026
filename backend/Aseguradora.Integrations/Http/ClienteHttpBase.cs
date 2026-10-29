using Aseguradora.Application.Exceptions;
using Microsoft.Extensions.Logging;
using Polly.CircuitBreaker;
using Polly.Timeout;

namespace Aseguradora.Integrations.Http;

/// <summary>
/// Base class every real HTTP client inherits. Translates network errors, timeouts, open circuits
/// and 5xx answers into <see cref="ExternalServiceException"/>, so Application never sees
/// <see cref="HttpRequestException"/>. 4xx answers are returned to the typed client on purpose:
/// only it knows what a 404 means (for example <c>PERSONA_NO_ENCONTRADA</c>).
/// </summary>
public abstract class ClienteHttpBase
{
    /// <summary>
    /// Marks a request the retry policy must not send again. <see cref="EnviarAsync"/> sets it on
    /// non-idempotent requests (a gateway payment creation must reach the other group exactly once).
    /// </summary>
    public static readonly HttpRequestOptionsKey<bool> SinReintento = new("Aseguradora.Integraciones.SinReintento");

    private readonly HttpClient _httpClient;
    private readonly ILogger _logger;

    protected ClienteHttpBase(HttpClient httpClient, ILogger logger)
    {
        _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>Name used in log entries and error messages.</summary>
    protected virtual string Servicio => GetType().Name;

    /// <summary>Sends the request and returns the answer when the other group answered 2xx, 3xx or 4xx.</summary>
    /// <exception cref="ExternalServiceException">Timeout, network error, open circuit or 5xx answer.</exception>
    protected async Task<HttpResponseMessage> EnviarAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken,
        bool esIdempotente = true)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (!esIdempotente)
            request.Options.Set(SinReintento, true);

        try
        {
            var respuesta = await _httpClient.SendAsync(request, cancellationToken);

            if ((int)respuesta.StatusCode >= 500)
            {
                var estado = (int)respuesta.StatusCode;
                respuesta.Dispose();
                throw new ExternalServiceException($"{Servicio}: el servicio externo respondió {estado}.");
            }

            return respuesta;
        }
        catch (TimeoutRejectedException ex)
        {
            _logger.LogWarning(ex, "{Servicio}: timeout agotado", Servicio);
            throw new ExternalServiceException($"{Servicio}: el servicio externo no respondió a tiempo.", ex);
        }
        catch (BrokenCircuitException ex)
        {
            _logger.LogWarning(ex, "{Servicio}: circuito abierto", Servicio);
            throw new ExternalServiceException($"{Servicio}: el circuito del servicio externo está abierto.", ex);
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            _logger.LogWarning("{Servicio}: timeout agotado", Servicio);
            throw new ExternalServiceException($"{Servicio}: el servicio externo no respondió a tiempo.");
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(ex, "{Servicio}: error de red", Servicio);
            throw new ExternalServiceException($"{Servicio}: no se pudo contactar al servicio externo.", ex);
        }
    }
}
