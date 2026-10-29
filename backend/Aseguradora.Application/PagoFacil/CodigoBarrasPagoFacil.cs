using System.Globalization;
using Aseguradora.Application.Exceptions;

namespace Aseguradora.Application.PagoFacil;

/// <summary>What a Pago Fácil barcode carries (CU20).</summary>
public sealed record DatosCodigoPagoFacil(
    int CodigoEmpresa,
    int NumeroPoliza,
    int NumeroCuota,
    decimal ImportePrimerVencimiento,
    DateOnly FechaPrimerVencimiento,
    decimal ImporteSegundoVencimiento,
    int DiasAlSegundoVencimiento);

/// <summary>
/// Builds, checks and reads the 42-digit Pago Fácil barcode. The code is never stored: it is built
/// again each time because it carries the amount with surcharge (spec 5).
/// Layout (default proposal of US-F3-06, to check against the Pago Fácil PDF):
/// company 5 + 1st amount in cents 8 + 1st due date yyyyMMdd 8 + policy 7 + installment 3
/// + 2nd amount in cents 7 + days to the 2nd due date 2 + check digits 2 = 42.
/// Each check digit is a modulo 10 with weights 3 and 1: the first covers the 40 digits before it,
/// the second the 41 before it, so any single altered digit fails.
/// </summary>
public static class CodigoBarrasPagoFacil
{
    public const int Longitud = 42;

    private const int AnchoEmpresa = 5;
    private const int AnchoImporte1 = 8;
    private const int AnchoFecha = 8;
    private const int AnchoPoliza = 7;
    private const int AnchoCuota = 3;
    private const int AnchoImporte2 = 7;
    private const int AnchoDias = 2;
    private const int LongitudSinVerificadores = Longitud - 2;
    private const string FormatoFecha = "yyyyMMdd";
    private const decimal CentavosPorPeso = 100m;

    public static string Generar(DatosCodigoPagoFacil datos)
    {
        ArgumentNullException.ThrowIfNull(datos);

        var cuerpo = string.Concat(
            Campo(datos.CodigoEmpresa, AnchoEmpresa, nameof(datos.CodigoEmpresa)),
            Importe(datos.ImportePrimerVencimiento, AnchoImporte1),
            datos.FechaPrimerVencimiento.ToString(FormatoFecha, CultureInfo.InvariantCulture),
            Campo(datos.NumeroPoliza, AnchoPoliza, nameof(datos.NumeroPoliza)),
            Campo(datos.NumeroCuota, AnchoCuota, nameof(datos.NumeroCuota)),
            Importe(datos.ImporteSegundoVencimiento, AnchoImporte2),
            Campo(datos.DiasAlSegundoVencimiento, AnchoDias, nameof(datos.DiasAlSegundoVencimiento)));

        var primerVerificador = DigitoVerificador(cuerpo);
        var conPrimero = cuerpo + primerVerificador;
        return conPrimero + DigitoVerificador(conPrimero);
    }

    /// <summary>True when the code has 42 digits and both check digits match.</summary>
    public static bool Validar(string? codigo)
    {
        if (codigo is null || codigo.Length != Longitud || !codigo.All(char.IsAsciiDigit))
            return false;

        return codigo[LongitudSinVerificadores] == DigitoVerificador(codigo.AsSpan(0, LongitudSinVerificadores))
            && codigo[Longitud - 1] == DigitoVerificador(codigo.AsSpan(0, Longitud - 1));
    }

    /// <summary>Reads back the data of a valid code (US-F3-07 and US-F3-08 use it).</summary>
    /// <exception cref="ArgumentException">The code is not valid.</exception>
    public static DatosCodigoPagoFacil Leer(string codigo)
    {
        if (!Validar(codigo))
            throw new ArgumentException("El código de Pago Fácil no es válido.", nameof(codigo));

        var posicion = 0;
        string Tomar(int ancho)
        {
            var campo = codigo.Substring(posicion, ancho);
            posicion += ancho;
            return campo;
        }

        var empresa = int.Parse(Tomar(AnchoEmpresa), CultureInfo.InvariantCulture);
        var importe1 = long.Parse(Tomar(AnchoImporte1), CultureInfo.InvariantCulture) / CentavosPorPeso;
        if (!DateOnly.TryParseExact(Tomar(AnchoFecha), FormatoFecha, CultureInfo.InvariantCulture, DateTimeStyles.None, out var fecha))
            throw new ArgumentException("El código de Pago Fácil tiene una fecha inválida.", nameof(codigo));
        var poliza = int.Parse(Tomar(AnchoPoliza), CultureInfo.InvariantCulture);
        var cuota = int.Parse(Tomar(AnchoCuota), CultureInfo.InvariantCulture);
        var importe2 = long.Parse(Tomar(AnchoImporte2), CultureInfo.InvariantCulture) / CentavosPorPeso;
        var dias = int.Parse(Tomar(AnchoDias), CultureInfo.InvariantCulture);

        return new DatosCodigoPagoFacil(empresa, poliza, cuota, importe1, fecha, importe2, dias);
    }

    private static string Campo(long valor, int ancho, string nombre)
    {
        if (valor < 0 || valor.ToString(CultureInfo.InvariantCulture).Length > ancho)
            throw new ArgumentOutOfRangeException(nombre, valor, $"No entra en {ancho} dígitos del código de Pago Fácil.");

        return valor.ToString(CultureInfo.InvariantCulture).PadLeft(ancho, '0');
    }

    private static string Importe(decimal importe, int ancho)
    {
        var centavos = decimal.Round(importe * CentavosPorPeso, 0, MidpointRounding.AwayFromZero);
        if (centavos < 0 || centavos.ToString(CultureInfo.InvariantCulture).Length > ancho)
            throw new BusinessRuleException($"El importe {importe:0.00} no entra en el código de Pago Fácil.");

        return ((long)centavos).ToString(CultureInfo.InvariantCulture).PadLeft(ancho, '0');
    }

    private static char DigitoVerificador(ReadOnlySpan<char> digitos)
    {
        var suma = 0;
        for (var i = 0; i < digitos.Length; i++)
            suma += (digitos[i] - '0') * (i % 2 == 0 ? 3 : 1);

        return (char)('0' + (10 - suma % 10) % 10);
    }
}
