using Aseguradora.Application.PagoFacil;

namespace Aseguradora.Tests.PagoFacil;

public sealed class CodigoBarrasPagoFacilTests
{
    private static readonly DatosCodigoPagoFacil Datos = new(
        CodigoEmpresa: 12345,
        NumeroPoliza: 1,
        NumeroCuota: 3,
        ImportePrimerVencimiento: 12000.00m,
        FechaPrimerVencimiento: new DateOnly(2026, 12, 10),
        ImporteSegundoVencimiento: 12600.00m,
        DiasAlSegundoVencimiento: 10);

    [Fact]
    public void Generar_Tiene42DigitosNumericos()
    {
        var codigo = CodigoBarrasPagoFacil.Generar(Datos);

        Assert.Equal(42, codigo.Length);
        Assert.All(codigo, c => Assert.True(char.IsAsciiDigit(c)));
    }

    [Fact]
    public void Generar_UsaElLayoutDeLaTarea()
    {
        var codigo = CodigoBarrasPagoFacil.Generar(Datos);

        // empresa 5 + importe 1 (centavos) 8 + fecha 8 + póliza 7 + cuota 3 + importe 2 (centavos) 7 + días 2.
        Assert.StartsWith("12345" + "01200000" + "20261210" + "0000001" + "003" + "1260000" + "10", codigo);
    }

    [Fact]
    public void Validar_CodigoGenerado_OK() =>
        Assert.True(CodigoBarrasPagoFacil.Validar(CodigoBarrasPagoFacil.Generar(Datos)));

    [Theory]
    [InlineData(0)]
    [InlineData(7)]
    [InlineData(20)]
    [InlineData(39)]
    [InlineData(40)]
    [InlineData(41)]
    public void Validar_DigitoAlterado_Falla(int posicion)
    {
        var digitos = CodigoBarrasPagoFacil.Generar(Datos).ToCharArray();
        digitos[posicion] = (char)('0' + (digitos[posicion] - '0' + 1) % 10);

        Assert.False(CodigoBarrasPagoFacil.Validar(new string(digitos)));
    }

    [Fact]
    public void Validar_CualquierDigitoAlterado_Falla()
    {
        var codigo = CodigoBarrasPagoFacil.Generar(Datos);

        for (var posicion = 0; posicion < codigo.Length; posicion++)
            for (var delta = 1; delta <= 9; delta++)
            {
                var digitos = codigo.ToCharArray();
                digitos[posicion] = (char)('0' + (digitos[posicion] - '0' + delta) % 10);
                Assert.False(CodigoBarrasPagoFacil.Validar(new string(digitos)), $"posición {posicion}, +{delta}");
            }
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("123")]
    [InlineData("12345012000002026121000000010031260000100A")]
    public void Validar_FormatoInvalido_Falla(string? codigo) =>
        Assert.False(CodigoBarrasPagoFacil.Validar(codigo));

    [Fact]
    public void Generar_Determinista() =>
        Assert.Equal(CodigoBarrasPagoFacil.Generar(Datos), CodigoBarrasPagoFacil.Generar(Datos with { }));

    [Fact]
    public void Generar_ImporteDistinto_CodigoDistinto() =>
        Assert.NotEqual(
            CodigoBarrasPagoFacil.Generar(Datos),
            CodigoBarrasPagoFacil.Generar(Datos with { ImportePrimerVencimiento = 12600.00m }));

    [Fact]
    public void IdaYVuelta_RecuperaPolizaYCuota()
    {
        var leidos = CodigoBarrasPagoFacil.Leer(CodigoBarrasPagoFacil.Generar(Datos));

        Assert.Equal(Datos, leidos);
    }

    [Fact]
    public void Leer_CodigoInvalido_Lanza() =>
        Assert.Throws<ArgumentException>(() => CodigoBarrasPagoFacil.Leer(new string('0', 41) + "1"));

    [Fact]
    public void Generar_PolizaQueNoEntra_Lanza() =>
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            CodigoBarrasPagoFacil.Generar(Datos with { NumeroPoliza = 10_000_000 }));
}
