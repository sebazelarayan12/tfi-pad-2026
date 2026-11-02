namespace Aseguradora.Application.Dtos.PagoFacil;

/// <summary>Result of processing a Pago Fácil settlement file (CU21).</summary>
/// <param name="Id">Identifier of the saved settlement.</param>
/// <param name="NombreArchivo">File name; each name is processed only once (RN18).</param>
/// <param name="CantidadRegistros">Payment lines in the file.</param>
/// <param name="ImporteTotal">Sum of the amounts of every line in the file.</param>
/// <param name="Procesadas">Lines applied: a payment was created and approved.</param>
/// <param name="Rechazadas">Lines not applied; see <paramref name="Errores"/>.</param>
/// <param name="Errores">Line number and reason of each rejected line.</param>
public sealed record RendicionResponse(
    Guid Id,
    string NombreArchivo,
    int CantidadRegistros,
    decimal ImporteTotal,
    int Procesadas,
    int Rechazadas,
    IReadOnlyList<ErrorLineaRendicion> Errores);
