using Aseguradora.Api.Security;

namespace Aseguradora.Api.Frentes.Frente1;

/// <summary>
/// Single DI entry point for Frente 1 (C5, C14). Later F1 tasks add their registrations here,
/// never in Program.cs.
/// </summary>
public static class Frente1Extensions
{
    public static IServiceCollection AddFrente1(this IServiceCollection services, IConfiguration config)
    {
        services.AddSeguridad(config);
        return services;
    }
}
