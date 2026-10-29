using Aseguradora.Data;
using Aseguradora.Data.Seed;
using Microsoft.EntityFrameworkCore;

namespace Aseguradora.Api.Comandos;

/// <summary>
/// Handles the <c>--migrar</c> argument: applies pending migrations, runs the idempotent seeders and
/// returns so the process exits without starting the web host. Production runs it by hand, never on
/// startup (11.2). Running it twice is safe: migrations and seeders both skip what already exists.
/// </summary>
public static class MigracionComando
{
    public const string Argumento = "--migrar";

    public static bool Solicitado(string[] args) => args.Contains(Argumento);

    /// <summary>Migrates and seeds. Throws when the database is unreachable or a migration fails.</summary>
    public static async Task AplicarAsync(IServiceProvider services, CancellationToken ct = default)
    {
        await using (var scope = services.CreateAsyncScope())
        {
            await scope.ServiceProvider.GetRequiredService<AseguradoraDbContext>().Database.MigrateAsync(ct);
        }
        await SeedData.EjecutarAsync(services, ct);
    }

    /// <summary>Runs <see cref="AplicarAsync"/> and returns the process exit code: 0 on success, 1 on failure.</summary>
    public static async Task<int> EjecutarAsync(IServiceProvider services, CancellationToken ct = default)
    {
        try
        {
            await AplicarAsync(services, ct);
            return 0;
        }
        catch (Exception ex)
        {
            services.GetRequiredService<ILoggerFactory>()
                .CreateLogger(typeof(MigracionComando))
                .LogCritical(ex, "No se pudieron aplicar las migraciones.");
            return 1;
        }
    }
}
