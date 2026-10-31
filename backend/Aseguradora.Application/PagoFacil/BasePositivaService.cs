using System.Globalization;
using System.Text;
using Aseguradora.Application.Dtos.PagoFacil;
using Aseguradora.Application.Exceptions;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Domain.Interfaces;
using static Aseguradora.Application.PagoFacil.LayoutBasePositivaPagoFacil;

namespace Aseguradora.Application.PagoFacil;

/// <summary>
/// Lists every Pendiente or Vencida installment of a Pendiente, Vigente or Suspendida policy (RN18), so
/// Pago Fácil can charge the client with the DNI alone. Amounts, due dates and barcode are the same as
/// the coupon of that day (US-F3-06), so the daily settlement (US-F3-07) accepts the payment.
/// </summary>
public sealed class BasePositivaService(IRepository<Cuota> cuotas, PagoFacilOpciones opciones) : IBasePositivaService
{
    private static readonly EstadoCuota[] CuotasCobrables = [EstadoCuota.Pendiente, EstadoCuota.Vencida];

    private static readonly EstadoPoliza[] PolizasConDeuda =
        [EstadoPoliza.Pendiente, EstadoPoliza.Vigente, EstadoPoliza.Suspendida];

    /// <inheritdoc />
    public Task<ArchivoBasePositiva> GenerarAsync(DateOnly hoy, CancellationToken ct = default)
    {
        // Application has no EF reference: the synchronous query is the same pattern as the other services.
        var deudas = cuotas.Query()
            .Where(c => CuotasCobrables.Contains(c.Estado) && PolizasConDeuda.Contains(c.Poliza.Estado))
            .OrderBy(c => c.Poliza.Numero)
            .ThenBy(c => c.Numero)
            .Select(c => new { Cuota = c, NumeroPoliza = c.Poliza.Numero, c.Poliza.Cliente.Dni })
            .ToList();

        var contenido = new StringBuilder();
        AgregarRegistro(contenido, TipoEncabezado
            + Numero(opciones.CodigoEmpresa, AnchoCodigoEmpresa)
            + hoy.ToString(FormatoFecha, CultureInfo.InvariantCulture));

        var total = 0m;
        foreach (var deuda in deudas)
        {
            var cupon = CuponPagoFacilService.Armar(deuda.Cuota, deuda.NumeroPoliza, hoy, opciones.CodigoEmpresa);
            total += cupon.ImportePrimerVencimiento;
            AgregarRegistro(contenido, TipoDetalle
                + Dni(deuda.Dni)
                + Numero(CodigoBarrasPagoFacil.Leer(cupon.CodigoBarras).NumeroPoliza, AnchoNumeroCliente)
                + Numero(cupon.NumeroCuota, AnchoNumeroCuota)
                + Importe(cupon.ImportePrimerVencimiento, AnchoImporte)
                + cupon.FechaPrimerVencimiento.ToString(FormatoFecha, CultureInfo.InvariantCulture)
                + Importe(cupon.ImporteSegundoVencimiento, AnchoImporte)
                + cupon.FechaSegundoVencimiento.ToString(FormatoFecha, CultureInfo.InvariantCulture)
                + cupon.CodigoBarras);
        }

        AgregarRegistro(contenido, TipoFinal + Numero(deudas.Count, AnchoCantidad) + Importe(total, AnchoTotal));

        var nombre = PrefijoNombreArchivo
            + Numero(opciones.CodigoEmpresa, AnchoCodigoEmpresa) + "_"
            + hoy.ToString(FormatoFecha, CultureInfo.InvariantCulture) + Extension;
        return Task.FromResult(new ArchivoBasePositiva(nombre, contenido.ToString(), deudas.Count, total));
    }

    private static void AgregarRegistro(StringBuilder contenido, string registro) =>
        contenido.Append(registro.PadRight(LongitudRegistro)).Append(FinDeLinea);

    private static string Dni(string dni)
    {
        var limpio = dni.Trim();
        if (limpio.Length is 0 or > AnchoDni || !limpio.All(char.IsAsciiDigit))
            throw new BusinessRuleException($"El DNI {dni} no entra en la base positiva ({AnchoDni} dígitos).");
        return limpio.PadLeft(AnchoDni, '0');
    }

    private static string Numero(long valor, int ancho)
    {
        var texto = valor.ToString(CultureInfo.InvariantCulture);
        if (valor < 0 || texto.Length > ancho)
            throw new BusinessRuleException($"El valor {valor} no entra en {ancho} dígitos de la base positiva.");
        return texto.PadLeft(ancho, '0');
    }

    private static string Importe(decimal pesos, int ancho) =>
        Numero(decimal.ToInt64(decimal.Round(pesos * CentavosPorPeso, MidpointRounding.AwayFromZero)), ancho);
}
