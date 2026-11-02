using Aseguradora.Application.External;
using Aseguradora.Application.Services;
using Aseguradora.Data.Seed;
using Aseguradora.Integrations;
using Aseguradora.Integrations.Dnrpa;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Aseguradora.Api.Frentes.Frente2;

/// <summary>
/// Single DI entry point for Frente 2 (C5, C14). Later F2 tasks add their registrations here,
/// never in Program.cs.
/// </summary>
public static class Frente2Extensions
{
    /// <summary>
    /// Registers Frente 2 services into the dependency injection container.
    /// </summary>
    /// <param name="services">Service collection to configure.</param>
    /// <param name="config">Application configuration.</param>
    /// <returns>The configured <see cref="IServiceCollection"/>.</returns>
    public static IServiceCollection AddFrente2(this IServiceCollection services, IConfiguration config)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(config);

        services.AddScoped<IPlanService, PlanService>();
        services.AddScoped<IVehiculoService, VehiculoService>();
        // Program.cs registers TimeProvider; TryAdd keeps this front working on its own.
        services.TryAddSingleton(TimeProvider.System);
        services.AddScoped<ICotizacionService, CotizacionService>();
        services.AddScoped<ISeeder, PlanesSeeder>();
        services.AgregarIntegracion<IDnrpaService, DnrpaMockService, DnrpaHttpService>(config, "Dnrpa");

        return services;
    }
}
