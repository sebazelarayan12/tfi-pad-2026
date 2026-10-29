using Aseguradora.Domain.Enums;
using Aseguradora.Domain.Exceptions;
using Aseguradora.Domain.Services;

namespace Aseguradora.Tests.Domain;

public class CalculadorCuotasTests
{
    private static readonly Guid PolizaId = Guid.NewGuid();
    private static readonly DateOnly Inicio = new(2026, 10, 28);

    [Theory]
    [InlineData(1)]
    [InlineData(6)]
    [InlineData(12)]
    public void GenerarCuotas_VigenciaValida_CantidadCorrecta(int vigencia)
    {
        var cuotas = CalculadorCuotas.GenerarCuotas(PolizaId, 12000m, Inicio, vigencia);

        Assert.Equal(vigencia, cuotas.Count);
        Assert.Equal(Enumerable.Range(1, vigencia), cuotas.Select(c => c.Numero));
        Assert.All(cuotas, c =>
        {
            Assert.Equal(PolizaId, c.PolizaId);
            Assert.Equal(EstadoCuota.Pendiente, c.Estado);
            Assert.Equal(0m, c.Recargo);
        });
    }

    [Theory]
    [InlineData(0)]
    [InlineData(3)]
    [InlineData(24)]
    public void GenerarCuotas_VigenciaInvalida_Lanza(int vigencia)
    {
        Assert.Throws<ReglaDeDominioException>(() => CalculadorCuotas.GenerarCuotas(PolizaId, 12000m, Inicio, vigencia));
    }

    [Fact]
    public void GenerarCuotas_ImportesIgualesAPrima()
    {
        var cuotas = CalculadorCuotas.GenerarCuotas(PolizaId, 9100.50m, Inicio, 6);

        Assert.All(cuotas, c => Assert.Equal(9100.50m, c.Importe));
    }

    [Fact]
    public void GenerarCuotas_VencimientoDia10DelMesSiguiente()
    {
        var cuotas = CalculadorCuotas.GenerarCuotas(PolizaId, 12000m, Inicio, 3 * 2);

        Assert.Equal(new DateOnly(2026, 11, 10), cuotas[0].FechaVencimiento);
        Assert.Equal(new DateOnly(2026, 12, 10), cuotas[1].FechaVencimiento);
        Assert.Equal(new DateOnly(2027, 1, 10), cuotas[2].FechaVencimiento);
        Assert.Equal(new DateOnly(2027, 4, 10), cuotas[5].FechaVencimiento);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void GenerarCuotas_PrimaCeroONegativa_Lanza(int prima)
    {
        Assert.Throws<ReglaDeDominioException>(() => CalculadorCuotas.GenerarCuotas(PolizaId, prima, Inicio, 6));
    }
}
