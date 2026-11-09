using Aseguradora.Application.Comun;
using Aseguradora.Application.Dtos;

namespace Aseguradora.Application.Services;

/// <summary>Consultas de pagos para el backoffice: listado general y pagos de una póliza (CU18).</summary>
public interface IPagoConsultaService
{
    /// <summary>Lista pagos, del más nuevo al más viejo, con filtros opcionales.</summary>
    /// <exception cref="Exceptions.BusinessRuleException">El estado o el medio no es un valor conocido.</exception>
    Task<PaginaResponse<PagoListadoResponse>> ListarAsync(PagoFiltro filtro, CancellationToken ct = default);

    /// <summary>Pagos de una póliza con su factura, del más nuevo al más viejo.</summary>
    /// <exception cref="Exceptions.NotFoundException">La póliza no existe.</exception>
    Task<IReadOnlyList<PagoResponse>> ListarPorPolizaAsync(Guid polizaId, CancellationToken ct = default);
}
