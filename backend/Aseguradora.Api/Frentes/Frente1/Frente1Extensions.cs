using Aseguradora.Api.Security;
using Aseguradora.Application.Publico;
using Aseguradora.Application.Security;
using Aseguradora.Data.Identity;
using Aseguradora.Data.Seed;
using Microsoft.Extensions.DependencyInjection.Extensions;

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
        services.AddIdentityAseguradora();
        services.AddScoped<ISeeder, AdministradorInicialSeeder>();

        // RN20: global rate limit for the whole /api/publico/* prefix (C15).
        services.AddPublicoRateLimit(config);
        // Shared DNI + policy/payment check for the public endpoints of F3 and F4 (US-F1-07).
        services.AddScoped<IVerificadorPublico, VerificadorPublico>();

        // CU01 and CU03: Application rules over an Identity-backed store, and the JWT issuer.
        services.AddScoped<IUsuarioStore, IdentityUsuarioStore>();
        // US-T-05 (PR #19) registers TimeProvider in Program.cs; TryAdd keeps this branch working
        // before that merge without overriding the shared registration afterwards.
        services.TryAddSingleton(TimeProvider.System);
        services.AddSingleton<ITokenService, JwtTokenService>();
        services.AddScoped<AutenticacionService>();

        return services;
    }
}
