namespace Aseguradora.Application.PagoFacil;

/// <summary>
/// Fixed-width layout of one line of the Pago Fácil settlement file (CU21). The real layout is in the
/// Pago Fácil (SEPSA) PDF, which is not in the repo: this is the mock layout of US-F3-07, kept in one
/// class so that only this file changes when the PDF arrives.
/// Line: barcode 42 + payment date yyyyMMdd 8 + amount paid in cents 10 = 60 characters, all digits.
/// </summary>
public static class LayoutRendicionPagoFacil
{
    public const int InicioCodigoBarras = 0;
    public const int AnchoCodigoBarras = CodigoBarrasPagoFacil.Longitud;

    public const int InicioFecha = InicioCodigoBarras + AnchoCodigoBarras;
    public const int AnchoFecha = 8;
    public const string FormatoFecha = "yyyyMMdd";

    public const int InicioImporte = InicioFecha + AnchoFecha;
    public const int AnchoImporte = 10;
    public const decimal CentavosPorPeso = 100m;

    public const int LongitudLinea = InicioImporte + AnchoImporte;
}
