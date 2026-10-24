using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Aseguradora.Data;

/// <summary>Used only by the EF Core tools (dotnet ef migrations / database update).</summary>
public class AseguradoraDbContextFactory : IDesignTimeDbContextFactory<AseguradoraDbContext>
{
    public const string ConnectionStringVariable = "ConnectionStrings__Default";

    public AseguradoraDbContext CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable(ConnectionStringVariable)
            ?? throw new InvalidOperationException(
                $"Set the {ConnectionStringVariable} environment variable before using the EF Core tools.");

        var options = new DbContextOptionsBuilder<AseguradoraDbContext>()
            .UseSqlServer(connectionString)
            .Options;
        return new AseguradoraDbContext(options);
    }
}
