using Aseguradora.Api.BackgroundJobs;
using Aseguradora.Application.PagoFacil;
using Aseguradora.Application.Services;
using Aseguradora.Data.Numeracion;
using Aseguradora.Data.Seed;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Options;

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

        // Program.cs registers TimeProvider; TryAdd keeps this front working on its own.
        services.TryAddSingleton(TimeProvider.System);

        // CU10: policy issuing (US-F3-02).
        services.AddScoped<INumeradorPolizas, NumeradorPolizasSql>();
        services.AddScoped<IPolizaService, PolizaService>();
        services.AddScoped<ISeeder, SeedFrente3>();

        // CU14: daily expiry process (US-F3-05).
        services.AddScoped<IVencimientosService, VencimientosService>();
        services.AddHostedService<VencimientosJob>();

        // CU20: Pago Fácil coupon (US-F3-06). A missing company code fails on the first coupon,
        // with the message of PagoFacilOpciones, without stopping the rest of the API.
        services.AddOptions<PagoFacilOpciones>()
            .Bind(config.GetSection(PagoFacilOpciones.Seccion))
            .ValidateDataAnnotations();
        services.AddScoped(sp => sp.GetRequiredService<IOptions<PagoFacilOpciones>>().Value);
        services.AddScoped<ICuponPagoFacilService, CuponPagoFacilService>();

        // CU19: insurance check for external systems (US-F3-04).
        services.AddScoped<ISeguroVigenteService, SeguroVigenteService>();

        return services;
    }
}
