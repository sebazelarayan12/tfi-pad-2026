using Aseguradora.Application.Dtos;
using Aseguradora.Application.External;
using Aseguradora.Application.Services;
using Aseguradora.Data;
using Aseguradora.Data.Repositories;
using Aseguradora.Data.Seed;
using Aseguradora.Domain.Entities;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Logging;

namespace Aseguradora.Tests.Pagos;

internal static class WebhookTestSupport
{
    public static PasarelaWebhookRequest Pedido(string estado = "APROBADO", decimal importe = 12000) => new()
    {
        IdPago = "PSR-" + Guid.NewGuid().ToString("N"), Estado = estado, Importe = importe,
        Fecha = DateTimeOffset.UtcNow, IdCuotas = [SeedData.CuotaId(2)]
    };

    public static WebhookPagoService Crear(AseguradoraDbContext db, bool confirmar = false,
        IPasarelaResolver? pasarela = null, IExclusionWebhook? exclusion = null,
        ILogger<WebhookPagoService>? logger = null) => new(
        new EfRepository<Pago>(db), new EfRepository<Cuota>(db), new EfRepository<Poliza>(db),
        new UnitOfWork(db), ServiciosPagoDePrueba.CrearAprobacion(db), pasarela ?? new PasarelaNoEsperada(),
        exclusion ?? new SinExclusion(), _ => confirmar, TimeProvider.System, logger ?? NullLogger<WebhookPagoService>.Instance);

    internal sealed class SinExclusion : IExclusionWebhook
    {
        public Task<IAsyncDisposable> AdquirirAsync(string clave, CancellationToken ct) =>
            Task.FromResult<IAsyncDisposable>(new Liberador());
        private sealed class Liberador : IAsyncDisposable { public ValueTask DisposeAsync() => ValueTask.CompletedTask; }
    }

    private sealed class PasarelaNoEsperada : IPasarelaResolver
    {
        public IPasarelaService Obtener(string proveedor) => throw new InvalidOperationException("No se esperaba confirmar.");
    }
}
