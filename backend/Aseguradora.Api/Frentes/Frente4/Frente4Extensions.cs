using Aseguradora.Integrations.Pagos;
using Aseguradora.Application.Services;
using Microsoft.Extensions.Options;
namespace Aseguradora.Api.Frentes.Frente4;
/// <summary>Define Frente4Extensions para la integración de pagos y facturación.</summary>
public static class Frente4Extensions
{
    /// <summary>Registra los servicios del frente de pagos según configuración.</summary>
    public static IServiceCollection AddFrente4(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddPagosIntegrations(configuration);
        services.AddOptions<FacturacionOpciones>()
            .Bind(configuration.GetSection("Facturacion"))
            .ValidateDataAnnotations().ValidateOnStart();
        services.AddSingleton(provider => provider.GetRequiredService<IOptions<FacturacionOpciones>>().Value);
        services.AddScoped<IFacturacionService, FacturacionService>();
        services.AddScoped<IAprobacionPagoService, AprobacionPagoService>();
        return services;
    }
}
