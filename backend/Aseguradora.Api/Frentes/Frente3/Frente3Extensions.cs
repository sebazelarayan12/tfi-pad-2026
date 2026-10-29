using Aseguradora.Application.Services;

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

        // CU19: insurance check for external systems (US-F3-04).
        services.AddScoped<ISeguroVigenteService, SeguroVigenteService>();

        return services;
    }
}
