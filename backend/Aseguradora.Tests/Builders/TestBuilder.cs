namespace Aseguradora.Tests.Builders;

/// <summary>Counter that keeps unique fields (DNI, email, patente...) apart between builds.</summary>
public static class TestBuilder
{
    private static int _secuencia;

    public static int Siguiente() => Interlocked.Increment(ref _secuencia);
}

/// <summary>
/// Base of the entity builders. <see cref="Construir"/> returns an entity that is valid by default
/// and unique on every call, so many can be saved in one database; <see cref="Con"/> overrides fields.
/// Fronts add their own builders next to these.
/// </summary>
public abstract class TestBuilder<TEntidad, TBuilder>
    where TEntidad : class
    where TBuilder : TestBuilder<TEntidad, TBuilder>
{
    private readonly List<Action<TEntidad>> _ajustes = [];

    protected int Secuencia { get; } = TestBuilder.Siguiente();

    protected abstract TEntidad CrearPorDefecto();

    public TBuilder Con(Action<TEntidad> ajuste)
    {
        ArgumentNullException.ThrowIfNull(ajuste);
        _ajustes.Add(ajuste);
        return (TBuilder)this;
    }

    public TEntidad Construir()
    {
        var entidad = CrearPorDefecto();
        foreach (var ajuste in _ajustes)
            ajuste(entidad);
        return entidad;
    }
}
