using Aseguradora.Application.Exceptions;
using Aseguradora.Application.Services;
using Aseguradora.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Aseguradora.Data.Repositories;

/// <summary>Recarga incluso entidades que ya estaban rastreadas antes del lock.</summary>
public sealed class RecargadorPago(AseguradoraDbContext db) : IRecargadorPago
{
    public async Task RecargarAsync(Pago pago, CancellationToken ct)
    {
        var entry = db.Entry(pago);
        await entry.ReloadAsync(ct);
        if (entry.State == EntityState.Detached) throw new NotFoundException("El pago no existe.");
    }
}
