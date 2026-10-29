using Aseguradora.Data;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace Aseguradora.Tests.Data;

/// <summary>
/// In-memory SQLite database built from the real EF model, so unique indexes and foreign keys
/// are enforced like in SQL Server. The seed data is included, as in the migration.
/// </summary>
public sealed class SqliteDbFixture : IDisposable
{
    private readonly SqliteConnection _connection = new("DataSource=:memory:");

    public SqliteDbFixture()
    {
        _connection.Open();
        using var context = CreateContext();
        context.Database.EnsureCreated();
    }

    public AseguradoraDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AseguradoraDbContext>()
            .UseSqlite(_connection)
            .Options;
        return new AseguradoraDbContext(options);
    }

    public void Dispose() => _connection.Dispose();
}
