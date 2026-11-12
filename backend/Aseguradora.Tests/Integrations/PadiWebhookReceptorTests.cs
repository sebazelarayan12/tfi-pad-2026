using System.Security.Cryptography;
using System.Text;
using Aseguradora.Integrations.Padi;

namespace Aseguradora.Tests.Integrations;

public class PadiWebhookReceptorTests
{
    private const string Secreto = "secreto-de-prueba-de-al-menos-32-caracteres";
    private const string IdLink = "3f1a7c2e-9b4d-4e1a-8c5f-2d6b7a9e0c11";

    internal static string Aviso(string evento = "payment.succeeded", string link = IdLink, string importe = "1500.00") => $$"""
        {"event":"{{evento}}","data":{"paymentId":"{{Guid.NewGuid()}}","paymentLinkId":"{{link}}","token":"tok123",
        "amount":{{importe}},"currency":"ARS","status":"Completed","paymentMethod":"Card","authorizationCode":"AUTH1",
        "transferId":"{{Guid.NewGuid()}}","completedAt":"2026-11-08T14:32:10+00:00"},"occurredAt":"2026-11-08T14:32:11+00:00"}
        """;

    internal static string Firmar(string cuerpo, string secreto = Secreto) =>
        Convert.ToHexString(HMACSHA256.HashData(Encoding.UTF8.GetBytes(secreto), Encoding.UTF8.GetBytes(cuerpo))).ToLowerInvariant();

    private static readonly PadiWebhookReceptor Receptor = new(activo: true, Secreto);

    [Fact]
    public void FirmaValida_TraduceAlAvisoComun()
    {
        var cuerpo = Aviso();

        var resultado = Receptor.Interpretar(Encoding.UTF8.GetBytes(cuerpo), Firmar(cuerpo));

        Assert.Equal(TipoResultadoWebhookPadi.Pago, resultado.Tipo);
        Assert.Equal(IdLink, resultado.Aviso!.IdPago);
        Assert.Equal("APROBADO", resultado.Aviso.Estado);
        Assert.Equal(1500.00m, resultado.Aviso.Importe);
        Assert.Equal(new DateTimeOffset(2026, 11, 8, 14, 32, 10, TimeSpan.Zero), resultado.Aviso.Fecha);
        Assert.Equal("Card", resultado.Aviso.MedioPago);
        Assert.Null(resultado.Aviso.ReferenciaExterna);
        Assert.Null(resultado.Aviso.IdCuotas);
    }

    [Fact]
    public void FirmaEnMayusculas_SeAcepta()
    {
        var cuerpo = Aviso();

        var resultado = Receptor.Interpretar(Encoding.UTF8.GetBytes(cuerpo), Firmar(cuerpo).ToUpperInvariant());

        Assert.Equal(TipoResultadoWebhookPadi.Pago, resultado.Tipo);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("no-es-hex")]
    [InlineData("abcd")]
    public void FirmaAusenteOMalFormada_FirmaInvalida(string? firma)
    {
        var resultado = Receptor.Interpretar(Encoding.UTF8.GetBytes(Aviso()), firma);

        Assert.Equal(TipoResultadoWebhookPadi.FirmaInvalida, resultado.Tipo);
    }

    [Fact]
    public void FirmaConOtroSecreto_FirmaInvalida()
    {
        var cuerpo = Aviso();

        var resultado = Receptor.Interpretar(Encoding.UTF8.GetBytes(cuerpo), Firmar(cuerpo, "otro-secreto-de-al-menos-32-caracteres!!"));

        Assert.Equal(TipoResultadoWebhookPadi.FirmaInvalida, resultado.Tipo);
    }

    [Fact]
    public void CuerpoAlteradoDespuesDeFirmar_FirmaInvalida()
    {
        var cuerpo = Aviso();
        var firma = Firmar(cuerpo);

        var resultado = Receptor.Interpretar(Encoding.UTF8.GetBytes(cuerpo.Replace("1500.00", "1.00")), firma);

        Assert.Equal(TipoResultadoWebhookPadi.FirmaInvalida, resultado.Tipo);
    }

    [Fact]
    public void OtroEvento_Ignorado()
    {
        var cuerpo = Aviso("payment.failed");

        Assert.Equal(TipoResultadoWebhookPadi.Ignorado, Receptor.Interpretar(Encoding.UTF8.GetBytes(cuerpo), Firmar(cuerpo)).Tipo);
    }

    [Theory]
    [InlineData("no es json")]
    [InlineData("""{"event":"payment.succeeded"}""")]
    [InlineData("""{"event":"payment.succeeded","data":{"paymentLinkId":"x","amount":10}}""")]
    public void CuerpoFirmadoPeroInvalido_CuerpoInvalido(string cuerpo)
    {
        Assert.Equal(TipoResultadoWebhookPadi.CuerpoInvalido, Receptor.Interpretar(Encoding.UTF8.GetBytes(cuerpo), Firmar(cuerpo)).Tipo);
    }

    [Theory]
    [InlineData(false, Secreto)]
    [InlineData(true, null)]
    [InlineData(true, "")]
    public void SinPadiOSinSecreto_Inactivo(bool activo, string? secreto)
    {
        var receptor = new PadiWebhookReceptor(activo, secreto);

        Assert.False(receptor.Activo);
        Assert.Throws<InvalidOperationException>(() => receptor.Interpretar(Encoding.UTF8.GetBytes(Aviso()), "x"));
    }
}
