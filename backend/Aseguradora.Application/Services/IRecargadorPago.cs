using Aseguradora.Domain.Entities;

namespace Aseguradora.Application.Services;

/// <summary>Actualiza un pago ya persistido y su token de concurrencia desde la base.</summary>
public interface IRecargadorPago
{
    Task RecargarAsync(Pago pago, CancellationToken ct);
}
