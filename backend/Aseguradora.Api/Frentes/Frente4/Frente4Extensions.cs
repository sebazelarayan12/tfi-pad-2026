using Aseguradora.Integrations.Pagos;
namespace Aseguradora.Api.Frentes.Frente4;
public static class Frente4Extensions
{
    public static IServiceCollection AddFrente4(this IServiceCollection services, IConfiguration configuration)
        => services.AddPagosIntegrations(configuration);
}