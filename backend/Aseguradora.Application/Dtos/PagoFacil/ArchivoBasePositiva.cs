namespace Aseguradora.Application.Dtos.PagoFacil;

/// <summary>Positive base file for Pago Fácil (CU22): name, ASCII content and trailer totals.</summary>
public sealed record ArchivoBasePositiva(
    string NombreArchivo,
    string Contenido,
    int CantidadRegistros,
    decimal ImporteTotal);
