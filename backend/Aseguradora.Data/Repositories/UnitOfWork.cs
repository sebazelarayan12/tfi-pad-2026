using Aseguradora.Domain.Interfaces;
using Aseguradora.Domain.Entities;
using Aseguradora.Application.Exceptions;
using Microsoft.Data.SqlClient;
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
        catch (DbUpdateException exception) when (
            exception.Entries.Any(e => e.Entity is Poliza) && EsViolacionDeUnicidad(exception))
        {
            throw new ViolacionUnicidadException("Otro registro con los mismos datos únicos se guardó antes.", exception);
        }
    }

    // SQL Server: 2601 (unique index) and 2627 (unique constraint). SQLite, used by the tests, only
    // reports it in the message.
    private static bool EsViolacionDeUnicidad(DbUpdateException exception) =>
        exception.InnerException switch
        {
            SqlException sql => sql.Number is 2601 or 2627,
            { } otra => otra.Message.Contains("UNIQUE constraint failed", StringComparison.Ordinal),
            null => false
        };
}
