using Aseguradora.Application.Dtos;

namespace Aseguradora.Application.Services;

/// <summary>Summary for the backoffice home page (PB-08).</summary>
public interface IResumenInicioService
{
    /// <summary>Counts and flags as of today in Argentina.</summary>
    Task<ResumenInicioResponse> ObtenerAsync(CancellationToken ct = default);
}
