namespace Aseguradora.Domain.Interfaces;

/// <summary>Persists every pending change of a use case in a single transaction.</summary>
public interface IUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
