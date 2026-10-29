namespace Aseguradora.Data.Seed;

/// <summary>
/// Startup data that depends on the environment or must be inserted only if missing
/// (initial admin, test quotes). Each front registers its own seeder inside its AddFrente&lt;N&gt;
/// with services.AddScoped&lt;ISeeder, ...&gt;(). Implementations must be idempotent.
/// Data every database needs (roles, plans) goes in HasData through SeedData.Apply instead.
/// </summary>
public interface ISeeder
{
    Task SembrarAsync(IServiceProvider services, CancellationToken ct);
}
