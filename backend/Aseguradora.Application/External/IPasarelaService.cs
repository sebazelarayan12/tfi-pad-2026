using Aseguradora.Application.Dtos;
namespace Aseguradora.Application.External;
public interface IPasarelaService { Task<PasarelaCrearPagoResponse> CrearPagoAsync(PasarelaCrearPagoRequest request, CancellationToken ct); Task<PasarelaPagoResponse> ConsultarPagoAsync(string idPago, CancellationToken ct); }