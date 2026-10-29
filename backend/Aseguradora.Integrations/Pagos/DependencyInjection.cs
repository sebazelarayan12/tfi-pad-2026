using Aseguradora.Application.External;
using Aseguradora.Integrations.Arca;
using Aseguradora.Integrations.Pasarela;
using Aseguradora.Integrations.Options;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using System.ComponentModel.DataAnnotations;
namespace Aseguradora.Integrations.Pagos;
public static class DependencyInjection
{
    public static IServiceCollection AddPagosIntegrations(this IServiceCollection services, IConfiguration configuration)
    {
        var proveedores = new Dictionary<string, IPasarelaService>(StringComparer.Ordinal);
        foreach (var proveedor in new[] { "pasarela1", "pasarela2" })
        {
            var key = $"Integraciones:Pasarelas:{proveedor}";
            var options = configuration.GetSection(key).Get<PasarelaOptions>() ?? new();
            Validator.ValidateObject(options, new ValidationContext(options), true);
            if (!options.UsarMock) throw new InvalidOperationException($"{key}:UsarMock=false requiere US-F4-08 (cliente HTTP).");
            services.Configure<PasarelaOptions>(proveedor, configuration.GetSection(key));
            proveedores.Add(proveedor, new PasarelaMockService(proveedor));
        }
        var arca = configuration.GetSection("Integraciones:Arca").Get<ArcaOptions>() ?? new();
        Validator.ValidateObject(arca, new ValidationContext(arca), true);
        if (!arca.UsarMock) throw new InvalidOperationException("Integraciones:Arca:UsarMock=false requiere US-F4-08 (cliente HTTP).");
        services.Configure<ArcaOptions>(configuration.GetSection("Integraciones:Arca"));
        services.AddSingleton<IPasarelaResolver>(new PasarelaResolver(proveedores));
        services.AddSingleton<IArcaService, ArcaMockService>();
        return services;
    }
}