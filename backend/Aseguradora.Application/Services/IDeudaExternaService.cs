using Aseguradora.Application.Dtos;

namespace Aseguradora.Application.Services;

/// <summary>Tells external systems how much a client owes in unpaid installments (CU13, RN08).</summary>
public interface IDeudaExternaService
{
    /// <exception cref="Exceptions.NotFoundException">No client has that DNI; its Codigo is CLIENTE_NO_ENCONTRADO.</exception>
    Task<DeudaExternaResponse> ObtenerDeudaAsync(string dni, CancellationToken ct = default);
}
