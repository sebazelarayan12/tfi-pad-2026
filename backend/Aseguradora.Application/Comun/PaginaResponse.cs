namespace Aseguradora.Application.Comun;

/// <summary>
/// One page of a paginated list, the format of every paginated endpoint of the API (US-F1-06).
/// </summary>
/// <param name="Items">Elements of this page.</param>
/// <param name="Pagina">Page number, from 1.</param>
/// <param name="TamanoPagina">Maximum number of elements per page.</param>
/// <param name="Total">Number of elements across all pages.</param>
public sealed record PaginaResponse<T>(IReadOnlyList<T> Items, int Pagina, int TamanoPagina, int Total);
