using Aseguradora.Integrations.Pagos;
using Aseguradora.Application.Services;
namespace Aseguradora.Api.Frentes.Frente4;
/// <summary>Define Frente4Extensions para la integración de pagos y facturación.</summary>
public static class Frente4Extensions
{
    /// <summary>Registra los servicios del frente de pagos según configuración.</summary>
    public static IServiceCollection AddFrente4(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddPagosIntegrations(configuration);
        services.AddSingleton(new FacturacionOpciones(configuration["Facturacion:Cuit"] ?? "",
            configuration.GetValue<int>("Facturacion:PuntoVenta")));
        services.AddScoped<IFacturacionService, FacturacionService>();
        services.AddScoped<IAprobacionPagoService, AprobacionPagoService>();
        return services;
    }
}
