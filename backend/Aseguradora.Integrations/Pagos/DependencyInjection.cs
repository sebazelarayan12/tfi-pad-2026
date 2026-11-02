using Aseguradora.Application.External;
using Aseguradora.Integrations.Arca;
using Aseguradora.Integrations.Configuration;
using Aseguradora.Integrations.Pasarela;
using Aseguradora.Integrations.Options;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
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
        var pasarelasReales = new HashSet<string>();
        foreach (var proveedor in proveedores)
        {
            var key = $"Integraciones:Pasarelas:{proveedor}";
            var options = configuration.GetSection(key).Get<PasarelaOptions>() ?? new();
            Validator.ValidateObject(options, new ValidationContext(options), true);
            services.Configure<PasarelaOptions>(proveedor, configuration.GetSection(key));
            if (options.UsarMock) continue;

            pasarelasReales.Add(proveedor);
            services.AgregarClienteResiliente<IntegracionOptions>(configuration, SeccionPasarela(proveedor));
        }
        var arca = configuration.GetSection("Integraciones:Arca").Get<ArcaOptions>() ?? new();
        Validator.ValidateObject(arca, new ValidationContext(arca), true);
        services.Configure<ArcaOptions>(configuration.GetSection("Integraciones:Arca"));
        services.AddSingleton<IPasarelaResolver>(provider => new PasarelaResolver(
            proveedores.ToDictionary(nombre => nombre,
                nombre => CrearPasarela(provider, nombre, pasarelasReales.Contains(nombre)))));
        // The mock keeps its payments in memory, so it stays a singleton; AgregarIntegracion would make it scoped.
        if (arca.UsarMock) services.AddSingleton<IArcaService, ArcaMockService>();
        else services.AgregarIntegracion<IArcaService, ArcaMockService, ArcaHttpService>(configuration, "Arca");
        return services;
    }

    private static IPasarelaService CrearPasarela(IServiceProvider provider, string proveedor, bool real)
    {
        if (!real)
            return new PasarelaMockService(proveedor, provider.GetRequiredService<TimeProvider>());

        var cliente = provider.GetRequiredService<IHttpClientFactory>().CreateClient(SeccionPasarela(proveedor));
        return new PasarelaHttpService(proveedor, cliente, provider.GetRequiredService<ILoggerFactory>().CreateLogger<PasarelaHttpService>());
    }

    private static string SeccionPasarela(string proveedor) => $"Pasarelas:{proveedor}";
}
