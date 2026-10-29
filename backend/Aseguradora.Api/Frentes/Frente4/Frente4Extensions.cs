using Aseguradora.Integrations.Pagos;
namespace Aseguradora.Api.Frentes.Frente4;
/// <summary>Define Frente4Extensions para la integración de pagos y facturación.</summary>
public static class Frente4Extensions
{
    /// <summary>Registra los servicios del frente de pagos según configuración.</summary>
    public static IServiceCollection AddFrente4(this IServiceCollection services, IConfiguration configuration)
        => services.AddPagosIntegrations(configuration);
}
