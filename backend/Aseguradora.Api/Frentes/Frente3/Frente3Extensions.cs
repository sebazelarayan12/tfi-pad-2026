using Aseguradora.Application.PagoFacil;
using Aseguradora.Application.Services;
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

        // CU20: Pago Fácil coupon (US-F3-06). A missing company code fails on the first coupon,
        // with the message of PagoFacilOpciones, without stopping the rest of the API.
        services.AddOptions<PagoFacilOpciones>()
            .Bind(config.GetSection(PagoFacilOpciones.Seccion))
            .ValidateDataAnnotations();
        services.AddScoped(sp => sp.GetRequiredService<IOptions<PagoFacilOpciones>>().Value);
        services.AddScoped<ICuponPagoFacilService, CuponPagoFacilService>();

        return services;
    }
}
