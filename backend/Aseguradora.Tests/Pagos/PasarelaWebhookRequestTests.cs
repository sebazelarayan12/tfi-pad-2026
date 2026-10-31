using System.ComponentModel.DataAnnotations;
using System.Globalization;

namespace Aseguradora.Tests.Pagos;

public sealed class PasarelaWebhookRequestTests
{
    [Theory]
    [InlineData("es-AR")]
    [InlineData("en-US")]
    public void ValidacionDelImporte_NoDependeDeLaCultura(string cultura)
    {
        var original = CultureInfo.CurrentCulture;
        try
        {
            CultureInfo.CurrentCulture = CultureInfo.GetCultureInfo(cultura);
            foreach (var importe in new[] { 0.01m, 12000.50m, 9999999999999999.99m })
            {
                var pedido = WebhookTestSupport.Pedido(importe: importe);
                Assert.True(Validator.TryValidateObject(pedido, new ValidationContext(pedido), [], true));
            }
            foreach (var importe in new[] { 0m, -1m, 0.001m, 10000000000000000m })
            {
                var pedido = WebhookTestSupport.Pedido(importe: importe);
                var errores = new List<ValidationResult>();
                Assert.False(Validator.TryValidateObject(pedido, new ValidationContext(pedido), errores, true));
                Assert.Contains(errores, e => e.MemberNames.Contains("Importe"));
            }
        }
        finally { CultureInfo.CurrentCulture = original; }
    }
}
