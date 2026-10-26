using Aseguradora.Data.Seed;
using Microsoft.Extensions.DependencyInjection;

namespace Aseguradora.Tests.Data;

public class SeedDataTests
{
    private sealed class RecordingSeeder(List<string> calls, string name) : ISeeder
    {
        public Task SembrarAsync(IServiceProvider services, CancellationToken ct)
        {
            calls.Add(name);
            return Task.CompletedTask;
        }
    }

    [Fact]
    public async Task EjecutarAsync_RecorreTodosLosSeedersRegistrados()
    {
        var calls = new List<string>();
        var services = new ServiceCollection()
            .AddScoped<ISeeder>(_ => new RecordingSeeder(calls, "frente1"))
            .AddScoped<ISeeder>(_ => new RecordingSeeder(calls, "frente2"))
            .BuildServiceProvider();

        await SeedData.EjecutarAsync(services);

        Assert.Equal(["frente1", "frente2"], calls);
    }

    [Fact]
    public async Task EjecutarAsync_SinSeeders_NoFalla()
    {
        var services = new ServiceCollection().BuildServiceProvider();

        await SeedData.EjecutarAsync(services);
    }
}
