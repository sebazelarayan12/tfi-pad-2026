using Aseguradora.Application.Dtos.PagoFacil;

namespace Aseguradora.Application.PagoFacil;

/// <summary>Processes the daily Pago Fácil settlement file (CU21).</summary>
public interface IRendicionService
{
    /// <summary>
    /// Creates and approves one payment per valid line. Lines with errors are reported and do not stop
    /// the file.
    /// </summary>
    /// <exception cref="Exceptions.BusinessRuleException">
    /// The name was already processed (RN18) or is invalid, or the file is empty, too large or has
    /// malformed lines. Nothing is saved.
    /// </exception>
    Task<RendicionResponse> ProcesarAsync(string nombreArchivo, Stream contenido, CancellationToken ct = default);

    /// <summary>Processed files, newest first.</summary>
    Task<IReadOnlyList<HistorialRendicionResponse>> ListarAsync(CancellationToken ct = default);
}
