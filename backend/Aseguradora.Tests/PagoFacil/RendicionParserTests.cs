using Aseguradora.Application.Exceptions;
using Aseguradora.Application.PagoFacil;
using Aseguradora.Tests.Support;

namespace Aseguradora.Tests.PagoFacil;

public sealed class RendicionParserTests
{
    private static readonly string LineaValida = RendicionesDePrueba.LineaDeCuota(1, 2, 12000m);

    [Fact]
    public void Parsea_LineaValida()
    {
        var resultado = RendicionParser.Parsear(LineaValida);

        var linea = Assert.Single(resultado.Lineas);
        Assert.Empty(resultado.Errores);
        Assert.Equal(1, linea.Numero);
        Assert.Equal(RendicionesDePrueba.Codigo(1, 2, 12000m), linea.CodigoBarras);
        Assert.Equal(RendicionesDePrueba.FechaPago, linea.Fecha);
        Assert.Equal(12000m, linea.Importe);
    }

    [Fact]
    public void LineasEnBlanco_SeSaltanPeroCuentanParaElNumero()
    {
        var resultado = RendicionParser.Parsear($"\r\n{LineaValida}\r\n   \r\n{LineaValida}\r\n");

        Assert.Equal([2, 4], resultado.Lineas.Select(l => l.Numero));
    }

    [Theory]
    [InlineData("corta", "caracteres")]
    [InlineData("letra", "dígitos")]
    [InlineData("fecha", "fecha")]
    [InlineData("cero", "cero")]
    public void LineaMalFormada_DevuelveErrorConNumero(string defecto, string motivo)
    {
        var mala = defecto switch
        {
            "corta" => LineaValida[..^1],
            "letra" => "A" + LineaValida[1..],
            "fecha" => RendicionesDePrueba.Codigo(1, 2, 12000m) + "20261332" + "0001200000",
            _ => RendicionesDePrueba.Linea(RendicionesDePrueba.Codigo(1, 2, 12000m), 0m)
        };

        var resultado = RendicionParser.Parsear($"{LineaValida}\n{mala}\n{LineaValida}");

        Assert.Equal(2, resultado.Lineas.Count);
        var error = Assert.Single(resultado.Errores);
        Assert.Equal(2, error.Linea);
        Assert.Contains(motivo, error.Motivo, StringComparison.OrdinalIgnoreCase);
    }

    [Theory]
    [InlineData("")]
    [InlineData("\r\n\r\n  \n")]
    public void ArchivoVacio_Lanza(string texto)
    {
        Assert.Throws<BusinessRuleException>(() => RendicionParser.Parsear(texto));
    }
}
