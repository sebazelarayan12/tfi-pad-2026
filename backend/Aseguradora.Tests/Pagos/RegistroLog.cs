using Microsoft.Extensions.Logging;
namespace Aseguradora.Tests.Pagos;
internal sealed class RegistroLog<T> : ILogger<T>
{
    public List<(LogLevel Nivel, string Texto)> Entradas { get; } = [];
    public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;
    public bool IsEnabled(LogLevel logLevel) => true;
    public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception,
        Func<TState, Exception?, string> formatter) => Entradas.Add((logLevel, formatter(state, exception)));
}
