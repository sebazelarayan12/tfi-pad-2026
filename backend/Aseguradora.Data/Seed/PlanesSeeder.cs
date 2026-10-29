using Aseguradora.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Aseguradora.Data.Seed;

/// <summary>
/// Idempotent startup seeder that inserts the TC (Terceros Completo) and TR (Todo Riesgo) plans
/// with fixed identifiers if their codes do not yet exist (US-F2-02, C5, C14).
/// Does not touch the RC plan seeded in <see cref="SeedData"/>.
/// </summary>
public sealed class PlanesSeeder(AseguradoraDbContext context) : ISeeder
{
    private readonly AseguradoraDbContext _context = context ?? throw new ArgumentNullException(nameof(context));

    /// <summary>Fixed identifier of the Terceros Completo (TC) plan.</summary>
    public static readonly Guid PlanTcId = Guid.Parse("a1000000-0000-0000-0000-000000000002");

    /// <summary>Fixed identifier of the Todo Riesgo (TR) plan.</summary>
    public static readonly Guid PlanTrId = Guid.Parse("a1000000-0000-0000-0000-000000000003");

    /// <summary>Base monthly premium of the TC plan (contract 9.5 C).</summary>
    public const decimal PrimaBaseTc = 18000.00m;

    /// <summary>Base monthly premium of the TR plan.</summary>
    public const decimal PrimaBaseTr = 30000.00m;

    /// <summary>Maximum vehicle age in years allowed for the TR plan (RN05).</summary>
    public const int AntiguedadMaximaTr = 10;

    private static readonly Plan[] PlanesSemilla =
    [
        new Plan
        {
            Id = PlanTcId,
            Codigo = "TC",
            Nombre = "Terceros Completo",
            Descripcion = "Cubre responsabilidad civil, robo, incendio y destrucción total.",
            PrimaBase = PrimaBaseTc,
            TiposPermitidos = "Auto,Moto,Camioneta",
            AntiguedadMaxima = null,
            Activo = true
        },
        new Plan
        {
            Id = PlanTrId,
            Codigo = "TR",
            Nombre = "Todo Riesgo",
            Descripcion = "Cubre terceros completo más daños parciales por accidente con franquicia.",
            PrimaBase = PrimaBaseTr,
            TiposPermitidos = "Auto,Camioneta",
            AntiguedadMaxima = AntiguedadMaximaTr,
            Activo = true
        }
    ];

    /// <inheritdoc />
    public async Task SembrarAsync(IServiceProvider services, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(services);

        var codigosExistentes = await _context.Planes
            .Select(p => p.Codigo)
            .ToListAsync(ct);

        var existentes = new HashSet<string>(codigosExistentes, StringComparer.OrdinalIgnoreCase);
        var huboCambios = false;

        foreach (var plantilla in PlanesSemilla)
        {
            if (existentes.Contains(plantilla.Codigo))
                continue;

            await _context.Planes.AddAsync(new Plan
            {
                Id = plantilla.Id,
                Codigo = plantilla.Codigo,
                Nombre = plantilla.Nombre,
                Descripcion = plantilla.Descripcion,
                PrimaBase = plantilla.PrimaBase,
                TiposPermitidos = plantilla.TiposPermitidos,
                AntiguedadMaxima = plantilla.AntiguedadMaxima,
                Activo = plantilla.Activo
            }, ct);

            huboCambios = true;
        }

        if (huboCambios)
            await _context.SaveChangesAsync(ct);
    }
}
