namespace Aseguradora.Tests.Support;

/// <summary>
/// Fixed <see cref="TimeProvider"/> for the tests that need deterministic dates (US-F1-03).
/// </summary>
public sealed class RelojFalso(DateTimeOffset ahora) : TimeProvider
{
    public override DateTimeOffset GetUtcNow() => ahora;
}
