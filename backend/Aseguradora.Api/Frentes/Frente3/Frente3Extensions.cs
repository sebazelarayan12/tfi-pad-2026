using Aseguradora.Api.BackgroundJobs;
using Aseguradora.Application.Services;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Aseguradora.Api.Frentes.Frente3;

/// <summary>
/// Single DI entry point for Frente 3 (C5, C14). Later F3 tasks add their registrations here,
/// never in Program.cs.
/// </summary>
public static class Frente3Extensions
{
    public static IServiceCollection AddFrente3(this IServiceCollection services, IConfiguration config)
    {
        services.AddScoped<IActualizadorEstadoPoliza, ActualizadorEstadoPoliza>();

        // CU14: daily expiry process (US-F3-05).
        // Program.cs registers TimeProvider; TryAdd keeps this front working on its own.
        services.TryAddSingleton(TimeProvider.System);
        services.AddScoped<IVencimientosService, VencimientosService>();
        services.AddHostedService<VencimientosJob>();

        return services;
    }
}
