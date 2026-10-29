using Aseguradora.Domain.Interfaces;
using Aseguradora.Domain.Entities;
using Aseguradora.Application.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Aseguradora.Data.Repositories;

public class UnitOfWork(AseguradoraDbContext context) : IUnitOfWork
{
    // EF Core wraps all pending changes of one SaveChanges call in a single transaction.
    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        try { return await context.SaveChangesAsync(cancellationToken); }
        catch (DbUpdateConcurrencyException exception) when (
            exception.Entries.Any(e => e.Entity is Pago or Cuota))
        {
            throw new BusinessRuleException("El pago o sus cuotas fueron modificados por otro cobro. Recargue los datos.", exception);
        }
    }
}
