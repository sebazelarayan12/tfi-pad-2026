using Aseguradora.Application.Dtos;

namespace Aseguradora.Tests.Application;

public class PatenteRegexTests
{
    [Theory]
    [InlineData("AB123CD")]
    [InlineData("ABC123")]
    [InlineData("ab123cd")]
    [InlineData("abc123")]
    public void EsPatenteValida_acepta_formatos_Mercosur_y_tradicional(string patente)
    {
        Assert.True(VehiculoAltaRequest.EsPatenteValida(patente));
    }

    [Theory]
    [InlineData("AB12CDE")]
    [InlineData("ABC1234")]
    [InlineData("A123")]
    [InlineData("")]
    [InlineData("   ")]
    public void EsPatenteValida_rechaza_formatos_invalidos(string patente)
    {
        Assert.False(VehiculoAltaRequest.EsPatenteValida(patente));
    }
}
