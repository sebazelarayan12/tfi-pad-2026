using Aseguradora.Application.Comun;
using Aseguradora.Application.Dtos;

namespace Aseguradora.Application.Services;

/// <summary>Global installment list for the backoffice (PB-24): overdue installments and client debt.</summary>
public interface ICuotaConsultaService
{
    /// <summary>Lists installments of every policy, oldest due date first, with optional filters.</summary>
    Task<PaginaResponse<CuotaListItemResponse>> ListarAsync(CuotaFiltro filtro, CancellationToken ct = default);
}
