namespace Aseguradora.Application.Services;
/// <summary>Identificación fiscal obtenida de Facturacion:Cuit y Facturacion:PuntoVenta.</summary>
public sealed record FacturacionOpciones(string Cuit, int PuntoVenta);
