using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using Aseguradora.Application.Dtos.PagoFacil;
using Aseguradora.Application.Exceptions;
using Aseguradora.Application.Services;
using Aseguradora.Application.Tiempo;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Domain.Exceptions;
using Aseguradora.Domain.Interfaces;

namespace Aseguradora.Application.PagoFacil;

/// <summary>
/// Applies the Pago Fácil settlement file (CU21). Each valid line becomes a Pendiente
/// <see cref="Pago"/> (medium PagoFacil) that <see cref="IAprobacionPagoService"/> approves, so the
/// installment, the policy and the invoice (RN12) follow the same path as every other payment.
/// Lines with errors are reported and do not stop the file; a file name is processed only once (RN18).
/// </summary>
public sealed partial class RendicionService(
    IRepository<RendicionPagoFacil> rendiciones,
    IRepository<Poliza> polizas,
    IRepository<Cuota> cuotas,
    IRepository<Pago> pagos,
    IAprobacionPagoService aprobacion,
    IUnitOfWork unitOfWork,
    PagoFacilOpciones opciones,
    TimeProvider reloj) : IRendicionService
{
    /// <summary>Largest file accepted: 5 MB (default proposal of US-F3-07).</summary>
    public const int TamanoMaximoBytes = 5 * 1024 * 1024;

    /// <summary>
    /// Pago.IdExterno is NombreArchivo + "#" + line (100 ASCII characters at most), so the name keeps
    /// room for the line number and only uses characters that ASCII columns store as they are.
    /// </summary>
    public const int NombreArchivoMaximo = 90;

    // The policy numerator always issues POL- plus 7 digits; the barcode carries only the digits.
    private const string FormatoNumeroPoliza = "POL-{0:D7}";

    private static readonly TimeOnly HoraAcreditacion = TimeOnly.MinValue;

    /// <inheritdoc />
    public async Task<RendicionResponse> ProcesarAsync(string nombreArchivo, Stream contenido, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(contenido);
        var nombre = ValidarNombre(nombreArchivo);
        var leido = RendicionParser.Parsear(await LeerAsync(contenido, ct));
        if (leido.Errores.Count > 0)
            throw new BusinessRuleException("El archivo de rendición tiene líneas mal formadas: "
                + string.Join("; ", leido.Errores.Select(e => $"línea {e.Linea}: {e.Motivo}")));

        if (await rendiciones.AnyAsync(r => r.NombreArchivo == nombre, ct))
            throw new BusinessRuleException($"El archivo {nombre} ya fue procesado (RN18).");

        var ahora = reloj.GetUtcNow().UtcDateTime;
        var rendicion = new RendicionPagoFacil
        {
            NombreArchivo = nombre,
            FechaRendicion = FechaArgentina.Hoy(reloj),
            CantidadRegistros = leido.Lineas.Count,
            ImporteTotal = leido.Lineas.Sum(l => l.Importe),
            FechaProceso = ahora
        };
        await rendiciones.AddAsync(rendicion, ct);
        try
        {
            await unitOfWork.SaveChangesAsync(ct);
        }
        catch (ViolacionUnicidadException ex)
        {
            // Another upload of the same name was saved after the check above.
            throw new BusinessRuleException($"El archivo {nombre} ya fue procesado (RN18).", ex);
        }

        var errores = new List<ErrorLineaRendicion>();
        foreach (var linea in leido.Lineas)
        {
            if (await AplicarAsync(linea, rendicion, ahora, ct) is { } motivo)
                errores.Add(new ErrorLineaRendicion(linea.Numero, motivo));
        }

        return new RendicionResponse(
            rendicion.Id, rendicion.NombreArchivo, rendicion.CantidadRegistros, rendicion.ImporteTotal,
            leido.Lineas.Count - errores.Count, errores.Count, errores);
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<HistorialRendicionResponse>> ListarAsync(CancellationToken ct = default)
    {
        ct.ThrowIfCancellationRequested();
        IReadOnlyList<HistorialRendicionResponse> historial = rendiciones.Query()
            .OrderByDescending(r => r.FechaProceso)
            .Select(r => new HistorialRendicionResponse(
                r.Id, r.NombreArchivo, r.FechaRendicion, r.FechaProceso, r.CantidadRegistros, r.ImporteTotal,
                r.Pagos.Count(p => p.Estado == EstadoPago.Aprobado)))
            .ToList();
        return Task.FromResult(historial);
    }

    /// <summary>Creates and approves the payment of one line; returns why not when it cannot.</summary>
    private async Task<string?> AplicarAsync(LineaRendicion linea, RendicionPagoFacil rendicion, DateTime ahora, CancellationToken ct)
    {
        if (!CodigoBarrasPagoFacil.Validar(linea.CodigoBarras))
            return "El código de barras no es válido (dígito verificador).";

        var datos = CodigoBarrasPagoFacil.Leer(linea.CodigoBarras);
        if (datos.CodigoEmpresa != opciones.CodigoEmpresa)
            return $"El código de barras es de la empresa {datos.CodigoEmpresa}, no de esta aseguradora.";

        var numeroPoliza = string.Format(CultureInfo.InvariantCulture, FormatoNumeroPoliza, datos.NumeroPoliza);
        var poliza = (await polizas.FindAsync(p => p.Numero == numeroPoliza, ct)).SingleOrDefault();
        if (poliza is null)
            return $"La póliza {numeroPoliza} no existe.";

        var cuota = (await cuotas.FindAsync(c => c.PolizaId == poliza.Id && c.Numero == datos.NumeroCuota, ct)).SingleOrDefault();
        if (cuota is null)
            return $"La cuota {datos.NumeroCuota} de la póliza {numeroPoliza} no existe.";
        if (cuota.Estado is not (EstadoCuota.Pendiente or EstadoCuota.Vencida))
            return $"La cuota {cuota.Numero} de la póliza {numeroPoliza} está {cuota.Estado} (RN11).";

        var esperado = cuota.Importe + cuota.Recargo;
        if (linea.Importe != esperado)
            return $"El importe pagado {linea.Importe:0.00} no coincide con el de la cuota ({esperado:0.00}).";

        var pago = Pago.CrearPendiente(
            poliza.ClienteId, await NumeroPago.GenerarAsync(pagos, ct), MedioPago.PagoFacil, [cuota], ahora);
        pago.IdExterno = $"{rendicion.NombreArchivo}#{linea.Numero}";
        pago.RendicionId = rendicion.Id;
        await pagos.AddAsync(pago, ct);
        await unitOfWork.SaveChangesAsync(ct);

        try
        {
            var acreditacion = FechaArgentina.AUtc(linea.Fecha, HoraAcreditacion).UtcDateTime;
            await aprobacion.AprobarAsync(pago, acreditacion, ct);
            return null;
        }
        catch (Exception ex) when (ex is BusinessRuleException or ReglaDeDominioException)
        {
            // The payment stays Pendiente with its line reference, for manual review.
            return ex.Message;
        }
    }

    private static string ValidarNombre(string nombreArchivo)
    {
        var nombre = Path.GetFileName(nombreArchivo?.Trim() ?? string.Empty);
        if (nombre.Length == 0 || nombre.Length > NombreArchivoMaximo || !NombreValido().IsMatch(nombre))
            throw new BusinessRuleException(
                $"El nombre del archivo debe tener entre 1 y {NombreArchivoMaximo} caracteres: letras sin acento, dígitos, '.', '-' o '_'.");
        return nombre;
    }

    private static async Task<string> LeerAsync(Stream contenido, CancellationToken ct)
    {
        // Reads one byte past the limit to tell a file of exactly 5 MB from a larger one.
        var buffer = new byte[TamanoMaximoBytes + 1];
        var total = 0;
        int leidos;
        while (total < buffer.Length && (leidos = await contenido.ReadAsync(buffer.AsMemory(total), ct)) > 0)
            total += leidos;

        if (total > TamanoMaximoBytes)
            throw new BusinessRuleException($"El archivo supera el máximo de {TamanoMaximoBytes / (1024 * 1024)} MB.");

        return Encoding.ASCII.GetString(buffer, 0, total);
    }

    [GeneratedRegex("^[A-Za-z0-9._-]+$")]
    private static partial Regex NombreValido();
}
