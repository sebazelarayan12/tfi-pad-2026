namespace Aseguradora.Application.Dtos.PagoFacil;

/// <summary>A settlement-file line that was not applied, and why (CU21).</summary>
/// <param name="Linea">Line number in the file, from 1.</param>
/// <param name="Motivo">Why the line was rejected.</param>
public sealed record ErrorLineaRendicion(int Linea, string Motivo);
