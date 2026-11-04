namespace Aseguradora.Application.Dtos.PagoFacil;

/// <summary>One processed settlement file in the history (CU21).</summary>
/// <param name="Id">Identifier of the settlement.</param>
/// <param name="NombreArchivo">Name of the processed file.</param>
/// <param name="FechaRendicion">Day the file was processed, in Argentina.</param>
/// <param name="FechaProceso">UTC timestamp of the processing.</param>
/// <param name="CantidadRegistros">Payment lines in the file.</param>
/// <param name="ImporteTotal">Sum of the amounts of every line in the file.</param>
/// <param name="PagosAprobados">Payments of the file that ended approved.</param>
public sealed record HistorialRendicionResponse(
    Guid Id,
    string NombreArchivo,
    DateOnly FechaRendicion,
    DateTime FechaProceso,
    int CantidadRegistros,
    decimal ImporteTotal,
    int PagosAprobados);
