using Aseguradora.Application.Publico.DTOs;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Domain.Interfaces;

namespace Aseguradora.Application.Publico;

/// <summary>
/// Shows the stored state of a policy to its holder (CU02). Only a Vigente policy has cover (RN10).
/// The surcharge and the Vencida state are owned by F3 (CU14), so this shows what is saved.
/// </summary>
public sealed class ConsultaPublicaService(
    IVerificadorPublico verificador,
    IRepository<Vehiculo> vehiculos,
    IRepository<Plan> planes,
    IRepository<Cuota> cuotas) : IConsultaPublicaService
{
    /// <inheritdoc />
    public async Task<ConsultaPublicaResponse> ConsultarAsync(ConsultaPublicaRequest request, CancellationToken ct = default)
    {
        var poliza = await verificador.VerificarPolizaAsync(request.Dni, request.NumeroPoliza, ct);
        var vehiculo = await vehiculos.GetByIdAsync(poliza.VehiculoId, ct)
            ?? throw new InvalidOperationException($"Policy {poliza.Numero} has no vehicle.");
        var plan = await planes.GetByIdAsync(poliza.PlanId, ct)
            ?? throw new InvalidOperationException($"Policy {poliza.Numero} has no plan.");
        var cuotasDePoliza = await cuotas.FindAsync(c => c.PolizaId == poliza.Id, ct);

        return new ConsultaPublicaResponse(
            poliza.Numero,
            Etiqueta(poliza.Estado),
            poliza.Estado == EstadoPoliza.Vigente,
            poliza.FechaInicio,
            poliza.FechaFin,
            new PlanPublico(plan.Codigo, plan.Nombre),
            new VehiculoPublico(vehiculo.Patente, vehiculo.Marca, vehiculo.Modelo, vehiculo.Anio),
            cuotasDePoliza
                .OrderBy(c => c.Numero)
                .Select(c => new CuotaPublica(c.Id, c.Numero, c.Importe, c.Recargo, c.Importe + c.Recargo,
                    c.FechaVencimiento, Etiqueta(c.Estado)))
                .ToList());
    }

    private static string Etiqueta<T>(T estado) where T : struct, Enum => estado.ToString().ToUpperInvariant();
}
