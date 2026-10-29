using Aseguradora.Application.External;
using Aseguradora.Integrations.Arca;
using Aseguradora.Integrations.Pasarela;
using Aseguradora.Integrations.Options;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using System.ComponentModel.DataAnnotations;
using Microsoft.Extensions.DependencyInjection.Extensions;
namespace Aseguradora.Integrations.Pagos;
/// <summary>Registro en el contenedor de DI de las integraciones de pagos y facturación.</summary>
public static class DependencyInjection
{
    private const string Pasarela1 = "pasarela1";
    private const string Pasarela2 = "pasarela2";

    /// <summary>Registra los servicios del frente de pagos según configuración.</summary>
    public static IServiceCollection AddPagosIntegrations(this IServiceCollection services, IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);
        services.TryAddSingleton(TimeProvider.System);
        var proveedores = new[] { Pasarela1, Pasarela2 };
        foreach (var proveedor in proveedores)
        {
            var key = $"Integraciones:Pasarelas:{proveedor}";
            var options = configuration.GetSection(key).Get<PasarelaOptions>() ?? new();
            Validator.ValidateObject(options, new ValidationContext(options), true);
            if (!options.UsarMock) throw new InvalidOperationException($"{key}:UsarMock=false requiere US-F4-08 (cliente HTTP).");
            services.Configure<PasarelaOptions>(proveedor, configuration.GetSection(key));
        }
        var arca = configuration.GetSection("Integraciones:Arca").Get<ArcaOptions>() ?? new();
        Validator.ValidateObject(arca, new ValidationContext(arca), true);
        if (!arca.UsarMock) throw new InvalidOperationException("Integraciones:Arca:UsarMock=false requiere US-F4-08 (cliente HTTP).");
        services.Configure<ArcaOptions>(configuration.GetSection("Integraciones:Arca"));
        services.AddSingleton<IPasarelaResolver>(provider => new PasarelaResolver(
            proveedores.ToDictionary(nombre => nombre,
                nombre => (IPasarelaService)new PasarelaMockService(nombre, provider.GetRequiredService<TimeProvider>()))));
        services.AddSingleton<IArcaService, ArcaMockService>();
        return services;
    }
}
