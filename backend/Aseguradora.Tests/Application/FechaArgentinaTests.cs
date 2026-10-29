using Aseguradora.Application.Tiempo;
using Aseguradora.Tests.Support;

namespace Aseguradora.Tests.Application;

public class FechaArgentinaTests
{
    [Fact]
    public void Hoy_ALas02UtcDel25_EsEl24EnArgentina()
    {
        var reloj = new RelojFalso(new DateTimeOffset(2026, 10, 25, 2, 0, 0, TimeSpan.Zero));

        Assert.Equal(new DateOnly(2026, 10, 24), FechaArgentina.Hoy(reloj));
    }

    [Fact]
    public void Hoy_AlMediodiaUtc_EsElMismoDia()
    {
        var reloj = new RelojFalso(new DateTimeOffset(2026, 10, 25, 12, 0, 0, TimeSpan.Zero));

        Assert.Equal(new DateOnly(2026, 10, 25), FechaArgentina.Hoy(reloj));
    }
}
