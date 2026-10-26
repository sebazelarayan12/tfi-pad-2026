using Aseguradora.Domain.Interfaces;

namespace Aseguradora.Data.Repositories;

public class UnitOfWork(AseguradoraDbContext context) : IUnitOfWork
{
    // EF Core wraps all pending changes of one SaveChanges call in a single transaction.
    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) =>
        context.SaveChangesAsync(cancellationToken);
}
