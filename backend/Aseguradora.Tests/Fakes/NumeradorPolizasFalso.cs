using Aseguradora.Application.Services;
using Aseguradora.Data.Numeracion;

namespace Aseguradora.Tests.Fakes;

/// <summary>
/// In-memory <see cref="INumeradorPolizas"/>: SQLite has no sequences. Counts up from
/// <paramref name="primero"/> and records how many numbers were handed out.
/// </summary>
public sealed class NumeradorPolizasFalso(long primero = 1) : INumeradorPolizas
{
    public int Entregados { get; private set; }

    public Task<string> SiguienteNumeroAsync(CancellationToken ct = default)
    {
        var numero = primero + Entregados;
        Entregados++;
        return Task.FromResult(NumeradorPolizasSql.Formatear(numero));
    }
}
