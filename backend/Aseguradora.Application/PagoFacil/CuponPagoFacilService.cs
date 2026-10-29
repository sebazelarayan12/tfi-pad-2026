using System.Globalization;
using Aseguradora.Application.Dtos.PagoFacil;
using Aseguradora.Application.Exceptions;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Domain.Interfaces;
using Aseguradora.Domain.Services;

namespace Aseguradora.Application.PagoFacil;

/// <summary>
/// Builds the coupon of a Pendiente or Vencida installment (CU20, RN11). The 1st due date is the
/// installment's own date, or today if it already passed; the 2nd comes
/// <see cref="DiasAlSegundoVencimiento"/> days later and charges the 5% surcharge (RN08).
/// </summary>
public sealed class CuponPagoFacilService(
    IRepository<Cuota> cuotas,
    IRepository<Poliza> polizas,
    PagoFacilOpciones opciones) : ICuponPagoFacilService
{
    /// <summary>Days between both due dates. The spec does not fix it (default proposal of US-F3-06).</summary>
    public const int DiasAlSegundoVencimiento = 10;

    /// <inheritdoc />
    public async Task<CuponPagoFacilResponse> GenerarAsync(Guid cuotaId, DateOnly hoy, CancellationToken ct = default)
    {
        var cuota = await cuotas.GetByIdAsync(cuotaId, ct)
            ?? throw new NotFoundException("La cuota no existe.");
        if (cuota.Estado is not (EstadoCuota.Pendiente or EstadoCuota.Vencida))
            throw new BusinessRuleException($"No se puede generar el cupón de una cuota en estado {cuota.Estado} (RN11).");

        var poliza = await polizas.GetByIdAsync(cuota.PolizaId, ct)
            ?? throw new NotFoundException("La póliza de la cuota no existe.");

        var importe1 = cuota.Importe + cuota.Recargo;
        var importe2 = Math.Round(cuota.Importe * (1 + TasaRecargoMora.Valor), 2, MidpointRounding.AwayFromZero);
        var fecha1 = cuota.FechaVencimiento > hoy ? cuota.FechaVencimiento : hoy;
        var fecha2 = fecha1.AddDays(DiasAlSegundoVencimiento);

        var codigo = CodigoBarrasPagoFacil.Generar(new DatosCodigoPagoFacil(
            opciones.CodigoEmpresa,
            NumeroDePoliza(poliza.Numero),
            cuota.Numero,
            importe1,
            fecha1,
            importe2,
            DiasAlSegundoVencimiento));

        return new CuponPagoFacilResponse(
            cuota.Id, poliza.Numero, cuota.Numero, importe1, fecha1, importe2, fecha2, codigo);
    }

    // POL-0000001 -> 1: the barcode carries only the digits of the policy number.
    private static int NumeroDePoliza(string numero)
    {
        var digitos = new string(numero.Where(char.IsAsciiDigit).ToArray());
        return int.TryParse(digitos, NumberStyles.None, CultureInfo.InvariantCulture, out var valor)
            ? valor
            : throw new BusinessRuleException($"El número de póliza {numero} no tiene un formato válido.");
    }
}
