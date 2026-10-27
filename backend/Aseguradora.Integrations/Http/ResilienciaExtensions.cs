using Aseguradora.Integrations.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Http.Resilience;
using Polly;
using Polly.Retry;

namespace Aseguradora.Integrations.Http;

/// <summary>
/// Shared resilience for every real client. No front defines its own timeouts or retries:
/// attempt timeout, bounded retries with exponential backoff, total timeout and circuit breaker
/// come from <see cref="IntegracionOptions"/> and these constants.
/// </summary>
public static class ResilienciaExtensions
{
    /// <summary>Header the other group expects the integration key in.</summary>
    public const string ApiKeyHeader = "X-Api-Key";

    /// <summary>Failures needed before the circuit breaker evaluates the sampling window.</summary>
    public const int FallosParaAbrirCircuito = 5;

    /// <summary>Window used to approximate "5 failures in 30 seconds".</summary>
    public static readonly TimeSpan VentanaCircuito = TimeSpan.FromSeconds(30);

    /// <summary>Room left for the exponential backoff inside the total timeout.</summary>
    private static readonly TimeSpan MargenBackoff = TimeSpan.FromSeconds(5);

    /// <summary>
    /// Adds the standard resilience handler with the shared defaults and the <c>X-Api-Key</c> header.
    /// </summary>
    public static IHttpClientBuilder AgregarResiliencia(this IHttpClientBuilder builder, IntegracionOptions opciones)
    {
        ArgumentNullException.ThrowIfNull(builder);
        ArgumentNullException.ThrowIfNull(opciones);

        var intentos = opciones.ReintentosMaximos;
        var timeoutIntento = TimeSpan.FromSeconds(opciones.TimeoutSegundos);
        // The standard handler rejects MaxRetryAttempts = 0, so "no retries" turns the predicate off.
        var intentosDelHandler = Math.Max(1, intentos);

        // The circuit breaker requires a sampling window of at least twice the attempt timeout.
        var muestreo = timeoutIntento * 2 > VentanaCircuito ? timeoutIntento * 2 : VentanaCircuito;

        builder.AddStandardResilienceHandler(options =>
        {
            options.AttemptTimeout.Timeout = timeoutIntento;

            options.Retry.MaxRetryAttempts = intentosDelHandler;
            options.Retry.BackoffType = DelayBackoffType.Exponential;
            options.Retry.ShouldHandle = intentos == 0
                ? _ => ValueTask.FromResult(false)
                : args => ValueTask.FromResult(EsReintentable(args));

            // The total timeout wraps the retries: one timeout per attempt plus room for the backoff.
            options.TotalRequestTimeout.Timeout = timeoutIntento * (intentos + 1) + MargenBackoff;

            options.CircuitBreaker.MinimumThroughput = FallosParaAbrirCircuito;
            options.CircuitBreaker.FailureRatio = 1.0;
            options.CircuitBreaker.SamplingDuration = muestreo;
        });

        builder.ConfigureHttpClient(client =>
        {
            if (!string.IsNullOrWhiteSpace(opciones.ApiKey))
                client.DefaultRequestHeaders.TryAddWithoutValidation(ApiKeyHeader, opciones.ApiKey);
        });

        return builder;
    }

    /// <summary>
    /// Retries only transient answers (5xx, 408, 429) and network errors. A non-idempotent request
    /// marked by <see cref="ClienteHttpBase.EnviarAsync"/> is sent once, and 4xx is never retried.
    /// </summary>
    private static bool EsReintentable(RetryPredicateArguments<HttpResponseMessage> args)
    {
        var request = args.Context.GetRequestMessage();
        if (request is not null && request.Options.TryGetValue(ClienteHttpBase.SinReintento, out var sinReintento) && sinReintento)
            return false;

        if (args.Outcome.Exception is { } excepcion)
            return excepcion is HttpRequestException;

        if (args.Outcome.Result is { } respuesta)
        {
            var estado = (int)respuesta.StatusCode;
            // 501 means "not implemented": retrying it cannot succeed either.
            return estado is 408 or 429 || (estado >= 500 && estado != 501);
        }

        return false;
    }
}
