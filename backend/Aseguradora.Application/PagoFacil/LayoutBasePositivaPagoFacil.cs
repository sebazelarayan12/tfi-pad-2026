namespace Aseguradora.Application.PagoFacil;

/// <summary>
/// Fixed-width layout of the positive base file (CU22). It is our own proposal until the Pago Fácil PDF
/// arrives: every record has <see cref="LongitudRegistro"/> ASCII characters, numbers are zero-padded on
/// the left, amounts go in cents and dates as <see cref="FormatoFecha"/>. Records end with CRLF.
/// <code>
/// H empresa(5) fechaGeneracion(8)                                   filler(spaces)
/// D dni(8) numeroCliente(7) cuota(3) importe1(10) fecha1(8) importe2(10) fecha2(8) codigoBarras(42)
/// T cantidad(7) total(15)                                           filler(spaces)
/// </code>
/// </summary>
public static class LayoutBasePositivaPagoFacil
{
    public const char TipoEncabezado = 'H';
    public const char TipoDetalle = 'D';
    public const char TipoFinal = 'T';

    public const string FormatoFecha = "yyyyMMdd";
    public const string FinDeLinea = "\r\n";
    public const decimal CentavosPorPeso = 100m;

    public const int AnchoCodigoEmpresa = 5;
    public const int AnchoFecha = 8;
    public const int AnchoDni = 8;

    /// <summary>The client number is the policy number of the barcode (US-F3-06), 7 digits.</summary>
    public const int AnchoNumeroCliente = 7;
    public const int AnchoNumeroCuota = 3;
    public const int AnchoImporte = 10;
    public const int AnchoCodigoBarras = CodigoBarrasPagoFacil.Longitud;
    public const int AnchoCantidad = 7;
    public const int AnchoTotal = 15;

    /// <summary>Length of the detail record, also used for the header and the trailer.</summary>
    public const int LongitudRegistro = 1 + AnchoDni + AnchoNumeroCliente + AnchoNumeroCuota
        + 2 * (AnchoImporte + AnchoFecha) + AnchoCodigoBarras;

    public const string Extension = ".txt";
    public const string PrefijoNombreArchivo = "BASEPOS_";
}
