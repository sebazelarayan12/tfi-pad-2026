using Aseguradora.Application.Dtos;
using Aseguradora.Application.Dtos.Externo;
using Aseguradora.Application.Exceptions;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Domain.Interfaces;

namespace Aseguradora.Application.Services;

/// <summary>
/// A vehicle is covered when it has a Vigente policy whose dates include today (RN10). An unknown
/// plate is not an error: it answers "no coverage" like any other uncovered vehicle.
/// </summary>
public sealed class SeguroVigenteService(
    IRepository<Vehiculo> vehiculos,
    IRepository<Poliza> polizas,
    IRepository<Plan> planes) : ISeguroVigenteService
{
    /// <inheritdoc />
    public async Task<SeguroVigenteResponse> ConsultarAsync(string patente, DateOnly hoy, CancellationToken ct = default)
    {
        var normalizada = Normalizar(patente);
        if (!VehiculoAltaRequest.EsPatenteValida(normalizada))
            throw new BusinessRuleException("La patente debe tener el formato AB123CD o ABC123.");

        var sinSeguro = new SeguroVigenteResponse(normalizada, TieneSeguro: false);

        var vehiculo = (await vehiculos.FindAsync(v => v.Patente == normalizada, ct)).SingleOrDefault();
        if (vehiculo is null)
            return sinSeguro;

        var poliza = (await polizas.FindAsync(
                p => p.VehiculoId == vehiculo.Id
                    && p.Estado == EstadoPoliza.Vigente
                    && p.FechaInicio <= hoy
                    && p.FechaFin >= hoy,
                ct))
            .OrderByDescending(p => p.FechaFin)
            .FirstOrDefault();
        if (poliza is null)
            return sinSeguro;

        var plan = await planes.GetByIdAsync(poliza.PlanId, ct);

        return new SeguroVigenteResponse(
            normalizada, TieneSeguro: true, poliza.Numero, plan?.Nombre, poliza.FechaInicio, poliza.FechaFin);
    }

    // Uppercase and without any space, so "ab 123 cd" finds AB123CD.
    private static string Normalizar(string? patente) =>
        string.Concat((patente ?? string.Empty).Where(c => !char.IsWhiteSpace(c))).ToUpperInvariant();
}
