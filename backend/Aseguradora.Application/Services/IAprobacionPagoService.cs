using Aseguradora.Domain.Entities;
namespace Aseguradora.Application.Services;
public interface IAprobacionPagoService { Task<Pago> AprobarAsync(Pago pago, DateTime fechaAcreditacion, CancellationToken ct); }