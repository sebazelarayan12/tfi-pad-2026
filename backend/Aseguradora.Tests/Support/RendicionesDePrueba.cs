using System.Globalization;
using System.Text;
using Aseguradora.Application.PagoFacil;

namespace Aseguradora.Tests.Support;

/// <summary>Builds settlement-file lines with the mock layout of US-F3-07.</summary>
internal static class RendicionesDePrueba
{
    public const int CodigoEmpresa = 12345;
    public static readonly DateOnly FechaPago = new(2026, 11, 5);

    /// <summary>A valid barcode for an installment, as the coupon of US-F3-06 builds it.</summary>
    public static string Codigo(int numeroPoliza, int numeroCuota, decimal importe, int empresa = CodigoEmpresa) =>
        CodigoBarrasPagoFacil.Generar(new DatosCodigoPagoFacil(
            empresa, numeroPoliza, numeroCuota, importe, FechaPago, importe * 1.05m, 10));

    public static string Linea(string codigo, decimal importe, DateOnly? fecha = null) =>
        codigo
        + (fecha ?? FechaPago).ToString(LayoutRendicionPagoFacil.FormatoFecha, CultureInfo.InvariantCulture)
        + ((long)(importe * LayoutRendicionPagoFacil.CentavosPorPeso)).ToString(CultureInfo.InvariantCulture)
            .PadLeft(LayoutRendicionPagoFacil.AnchoImporte, '0');

    public static string LineaDeCuota(int numeroPoliza, int numeroCuota, decimal importe) =>
        Linea(Codigo(numeroPoliza, numeroCuota, importe), importe);

    public static MemoryStream Archivo(params string[] lineas) =>
        new(Encoding.ASCII.GetBytes(string.Join("\r\n", lineas) + "\r\n"));

    /// <summary>The number the barcode carries for a policy: POL-0000001 -> 1.</summary>
    public static int NumeroEnCodigo(string numeroPoliza) =>
        int.Parse(numeroPoliza["POL-".Length..], CultureInfo.InvariantCulture);
}
