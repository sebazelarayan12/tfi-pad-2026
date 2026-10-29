using Aseguradora.Application.Dtos;
namespace Aseguradora.Application.External;
public interface IArcaService { Task<ArcaFacturaResponse> EmitirFacturaAsync(ArcaFacturaRequest request, CancellationToken ct); Task<ArcaFacturaResponse> ConsultarFacturaAsync(string numeroComprobante, CancellationToken ct); }