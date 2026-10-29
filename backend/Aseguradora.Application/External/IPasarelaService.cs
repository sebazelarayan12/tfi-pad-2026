using Aseguradora.Application.Dtos;
namespace Aseguradora.Application.External;
/// <summary>Contrato con una pasarela de pagos para crear y consultar pagos.</summary>
public interface IPasarelaService
{
    /// <summary>Crea un checkout pendiente para la referencia externa indicada.</summary>
    Task<PasarelaCrearPagoResponse> CrearPagoAsync(PasarelaCrearPagoRequest request, CancellationToken ct);
    /// <summary>Consulta el estado almacenado de un pago.</summary>
    Task<PasarelaPagoResponse> ConsultarPagoAsync(string idPago, CancellationToken ct);
}
