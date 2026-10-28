using Aseguradora.Application.Dtos;
using Aseguradora.Application.Exceptions;
using Aseguradora.Application.Services;
using Aseguradora.Data.Seed;
using Aseguradora.Domain.Enums;

namespace Aseguradora.Tests.Fakes;

/// <summary>
/// In-memory fake implementation of <see cref="ICotizacionService"/> for Frente 3 and unit tests.
/// Exposes a fixed active quote (<see cref="CotizacionVigenteId"/>) and an expired quote (<see cref="CotizacionVencidaId"/>).
/// </summary>
public sealed class FakeCotizacionService : ICotizacionService
{
    /// <summary>Fixed identifier of the preloaded active quote.</summary>
    public static readonly Guid CotizacionVigenteId = Guid.Parse("a2000000-0000-0000-0000-000000000001");

    /// <summary>Fixed identifier of the preloaded expired quote.</summary>
    public static readonly Guid CotizacionVencidaId = Guid.Parse("a2000000-0000-0000-0000-000000000002");

    private static readonly DateTime FechaEmisionBase = new(2026, 10, 15, 0, 0, 0, DateTimeKind.Utc);
    private static readonly DateTime FechaVencimientoFutura = new(2099, 12, 31, 23, 59, 59, DateTimeKind.Utc);
    private static readonly DateTime FechaVencimientoPasada = new(2020, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    private readonly Dictionary<Guid, CotizacionDto> _cotizaciones = new()
    {
        [CotizacionVigenteId] = new CotizacionDto(
            Id: CotizacionVigenteId,
            PlanId: SeedData.PlanRcId,
            CodigoPlan: "RC",
            ClienteId: SeedData.ClienteId,
            VehiculoId: SeedData.VehiculoId,
            PrimaMensual: 12000.00m,
            FechaCotizacion: FechaEmisionBase,
            FechaVencimiento: FechaVencimientoFutura,
            Origen: OrigenCotizacion.Panel),
        [CotizacionVencidaId] = new CotizacionDto(
            Id: CotizacionVencidaId,
            PlanId: SeedData.PlanRcId,
            CodigoPlan: "RC",
            ClienteId: SeedData.ClienteId,
            VehiculoId: SeedData.VehiculoId,
            PrimaMensual: 12000.00m,
            FechaCotizacion: new DateTime(2019, 12, 17, 0, 0, 0, DateTimeKind.Utc),
            FechaVencimiento: FechaVencimientoPasada,
            Origen: OrigenCotizacion.Panel)
    };

    /// <summary>
    /// Adds or replaces a quote in the in-memory store for custom test scenarios.
    /// </summary>
    /// <param name="cotizacion">Quote DTO to store.</param>
    public void Guardar(CotizacionDto cotizacion)
    {
        ArgumentNullException.ThrowIfNull(cotizacion);
        _cotizaciones[cotizacion.Id] = cotizacion;
    }

    /// <inheritdoc />
    public Task<CotizacionDto> ObtenerAsync(Guid id, CancellationToken ct = default)
    {
        if (!_cotizaciones.TryGetValue(id, out var cotizacion))
            throw new NotFoundException($"La cotización {id} no existe.");

        return Task.FromResult(cotizacion);
    }

    /// <inheritdoc />
    public Task<CotizacionResultado> CotizarVehiculoAsync(Guid vehiculoId, CancellationToken ct = default)
    {
        var vigente = _cotizaciones[CotizacionVigenteId];
        var resultado = new CotizacionResultado(
            vigente.FechaVencimiento,
            [new OpcionCotizacion(vigente.Id, vigente.CodigoPlan, "Responsabilidad Civil", vigente.PrimaMensual)]);

        return Task.FromResult(resultado);
    }
}
