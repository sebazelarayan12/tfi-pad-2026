using Aseguradora.Application.Comun;
using Aseguradora.Application.Dtos;

namespace Aseguradora.Application.Services;

/// <summary>Consulta del listado de cotizaciones para el backoffice (CU09).</summary>
public interface ICotizacionConsultaService
{
    /// <summary>Lista cotizaciones, de la más nueva a la más vieja, con filtros opcionales.</summary>
    Task<PaginaResponse<CotizacionListItemResponse>> ListarAsync(CotizacionFiltro filtro, CancellationToken ct = default);
}
