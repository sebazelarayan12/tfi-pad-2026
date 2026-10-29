using Aseguradora.Application.Services;
using Microsoft.EntityFrameworkCore;

namespace Aseguradora.Data.Numeracion;

/// <summary>
/// Policy numbers from the SQL Server sequence <c>dbo.SeqNumeroPoliza</c>
/// (migration AgregarSecuenciaNumeroPoliza). A sequence never repeats a value, even with two
/// issues at the same time, which a <c>MAX + 1</c> query cannot guarantee.
/// </summary>
public sealed class NumeradorPolizasSql(AseguradoraDbContext context) : INumeradorPolizas
{
    private const string Prefijo = "POL-";
    private const string FormatoNumero = "D7";

    /// <inheritdoc />
    public async Task<string> SiguienteNumeroAsync(CancellationToken ct = default)
    {
        // Not composed (no SingleAsync): SQL Server rejects NEXT VALUE FOR inside the subquery EF
        // would wrap it in.
        var valores = await context.Database
            .SqlQuery<long>($"SELECT NEXT VALUE FOR dbo.SeqNumeroPoliza AS [Value]")
            .ToListAsync(ct);

        return Formatear(valores.Single());
    }

    /// <summary>Formats a sequence value as a policy number, e.g. 1 as <c>POL-0000001</c>.</summary>
    public static string Formatear(long numero) => Prefijo + numero.ToString(FormatoNumero);
}
