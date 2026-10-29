using Aseguradora.Tests.Fixtures;
using Microsoft.Extensions.Options;
namespace Aseguradora.Tests.Pagos;
public class FacturacionConfiguracionTests
{
    [Theory]
    [InlineData("", "1")]
    [InlineData("   ", "1")]
    [InlineData("00000000000", "0")]
    [InlineData("00000000000", "-1")]
    public void ApiNoArrancaConDatosFiscalesInvalidos(string cuit, string puntoVenta)
    {
        using var api = new AseguradoraWebFactory();
        api.Ajustes["Facturacion:Cuit"] = cuit;
        api.Ajustes["Facturacion:PuntoVenta"] = puntoVenta;
        Assert.Throws<OptionsValidationException>(() => api.CreateClient());
    }
}
