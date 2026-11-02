using System.Globalization;
using Aseguradora.Application.Dtos.PagoFacil;
using Aseguradora.Application.Exceptions;

namespace Aseguradora.Application.PagoFacil;

/// <summary>One payment read from the settlement file.</summary>
/// <param name="Numero">Line number in the file, from 1.</param>
/// <param name="CodigoBarras">42-digit barcode of the coupon that was paid.</param>
/// <param name="Fecha">Date the client paid.</param>
/// <param name="Importe">Amount paid.</param>
public sealed record LineaRendicion(int Numero, string CodigoBarras, DateOnly Fecha, decimal Importe);

/// <summary>Lines read from the file and the format errors found, by line number.</summary>
public sealed record ResultadoRendicionParser(
    IReadOnlyList<LineaRendicion> Lineas,
    IReadOnlyList<ErrorLineaRendicion> Errores);

/// <summary>
/// Reads the settlement file with <see cref="LayoutRendicionPagoFacil"/>. It only checks the format;
/// the barcode check digits and the installment are checked by <see cref="RendicionService"/>.
/// Blank lines are skipped but still counted, so line numbers match the file.
/// </summary>
public static class RendicionParser
{
    /// <exception cref="BusinessRuleException">The file has no lines.</exception>
    public static ResultadoRendicionParser Parsear(string texto)
    {
        ArgumentNullException.ThrowIfNull(texto);

        var lineas = new List<LineaRendicion>();
        var errores = new List<ErrorLineaRendicion>();
        var renglones = texto.Split('\n');
        for (var i = 0; i < renglones.Length; i++)
        {
            var renglon = renglones[i].TrimEnd('\r');
            if (string.IsNullOrWhiteSpace(renglon))
                continue;

            var numero = i + 1;
            var (linea, motivo) = LeerLinea(numero, renglon);
            if (linea is not null)
                lineas.Add(linea);
            else
                errores.Add(new ErrorLineaRendicion(numero, motivo!));
        }

        if (lineas.Count == 0 && errores.Count == 0)
            throw new BusinessRuleException("El archivo de rendición está vacío.");

        return new ResultadoRendicionParser(lineas, errores);
    }

    private static (LineaRendicion? Linea, string? Motivo) LeerLinea(int numero, string renglon)
    {
        if (renglon.Length != LayoutRendicionPagoFacil.LongitudLinea)
            return (null, $"La línea tiene {renglon.Length} caracteres y deben ser {LayoutRendicionPagoFacil.LongitudLinea}.");
        if (!renglon.All(char.IsAsciiDigit))
            return (null, "La línea solo puede tener dígitos.");

        var fechaTexto = renglon.Substring(LayoutRendicionPagoFacil.InicioFecha, LayoutRendicionPagoFacil.AnchoFecha);
        if (!DateOnly.TryParseExact(fechaTexto, LayoutRendicionPagoFacil.FormatoFecha,
                CultureInfo.InvariantCulture, DateTimeStyles.None, out var fecha))
            return (null, $"La fecha de pago {fechaTexto} no es válida.");

        var centavos = long.Parse(
            renglon.AsSpan(LayoutRendicionPagoFacil.InicioImporte, LayoutRendicionPagoFacil.AnchoImporte),
            NumberStyles.None, CultureInfo.InvariantCulture);
        if (centavos == 0)
            return (null, "El importe pagado no puede ser cero.");

        var linea = new LineaRendicion(
            numero,
            renglon.Substring(LayoutRendicionPagoFacil.InicioCodigoBarras, LayoutRendicionPagoFacil.AnchoCodigoBarras),
            fecha,
            centavos / LayoutRendicionPagoFacil.CentavosPorPeso);
        return (linea, null);
    }
}
