using Aseguradora.Application.Dtos.PagoFacil;

namespace Aseguradora.Application.PagoFacil;

/// <summary>Builds the Pago Fácil positive base with every debt still payable (CU22). Nothing is stored.</summary>
public interface IBasePositivaService
{
    Task<ArchivoBasePositiva> GenerarAsync(DateOnly hoy, CancellationToken ct = default);
}
