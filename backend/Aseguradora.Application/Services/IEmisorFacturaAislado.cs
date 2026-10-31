namespace Aseguradora.Application.Services;

/// <summary>Ejecuta un reintento en una unidad de trabajo independiente.</summary>
public interface IEmisorFacturaAislado
{
    Task EmitirAsync(Guid pagoId, CancellationToken ct);
}
