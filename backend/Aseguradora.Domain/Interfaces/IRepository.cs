using System.Linq.Expressions;
using Aseguradora.Domain.Entities;

namespace Aseguradora.Domain.Interfaces;

/// <summary>
/// Generic data access. It never persists on its own: changes are saved by <see cref="IUnitOfWork"/>.
/// </summary>
public interface IRepository<T> where T : EntityBase
{
    Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<T>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<T>> FindAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default);
    Task<bool> AnyAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default);
    Task AddAsync(T entity, CancellationToken cancellationToken = default);
    void Update(T entity);
    void Remove(T entity);

    /// <summary>Query root for filters, includes and paging that the basic methods do not cover.</summary>
    IQueryable<T> Query();
}
