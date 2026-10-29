using Aseguradora.Integrations.Http;
using Microsoft.Extensions.Logging;

namespace Aseguradora.Tests.Integrations;

/// <summary>Contract of a fake external service; stands in for Renaper/Dnrpa/Arca.</summary>
public interface IServicioFalso
{
    string Nombre { get; }
}

/// <summary>Mock implementation resolved while <c>UsarMock</c> is true.</summary>
public sealed class MockFalso : IServicioFalso
{
    public string Nombre => "mock";
}

/// <summary>Real implementation resolved while <c>UsarMock</c> is false; inherits the shared base.</summary>
public sealed class RealFalso(HttpClient httpClient, ILogger<RealFalso> logger)
    : ClienteHttpBase(httpClient, logger), IServicioFalso
{
    public string Nombre => "real";

    public Task<HttpResponseMessage> Enviar(
        HttpRequestMessage request,
        CancellationToken cancellationToken = default,
        bool esIdempotente = true)
        => EnviarAsync(request, cancellationToken, esIdempotente);
}

/// <summary>Handler that counts calls and answers with the given behaviour, so no socket is opened.</summary>
internal sealed class ContadorHandler(Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> responder)
    : HttpMessageHandler
{
    public int Llamadas { get; private set; }

    public HttpRequestMessage? UltimoPedido { get; private set; }

    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        Llamadas++;
        UltimoPedido = request;
        return responder(request, cancellationToken);
    }
}

/// <summary>Keeps every log entry so a test can assert what did and did not reach the logs.</summary>
internal sealed class CapturingLoggerProvider : ILoggerProvider
{
    private readonly List<string> _entradas = [];

    public IReadOnlyList<string> Entradas => _entradas;

    public ILogger CreateLogger(string categoryName) => new CapturingLogger(_entradas);

    public void Dispose()
    {
    }

    private sealed class CapturingLogger(List<string> entradas) : ILogger
    {
        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;

        public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(
            LogLevel logLevel,
            EventId eventId,
            TState state,
            Exception? exception,
            Func<TState, Exception?, string> formatter)
        {
            lock (entradas)
                entradas.Add($"{formatter(state, exception)} {exception}");
        }
    }
}
