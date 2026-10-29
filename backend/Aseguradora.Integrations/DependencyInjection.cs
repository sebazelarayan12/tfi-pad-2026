using Aseguradora.Integrations.Configuration;
using Aseguradora.Integrations.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Options;

namespace Aseguradora.Integrations;

/// <summary>
/// Single entry point for integrations. Every front registers its own services through this class
/// and never defines timeouts, retries or its own DI extension.
/// </summary>
public static class DependencyInjection
{
    /// <summary>
    /// Registers the shared integration infrastructure. Concrete services are registered by each
    /// front with <see cref="AgregarIntegracion{TInterfaz,TMock,TReal}"/> or
    /// <see cref="AgregarClienteResiliente{TOpciones}"/>.
    /// </summary>
    public static IServiceCollection AddIntegraciones(this IServiceCollection services, IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);

        services.AddHttpClient();
        services.TryAddEnumerable(ServiceDescriptor.Singleton<IValidateOptions<IntegracionOptions>, IntegracionOptionsValidator<IntegracionOptions>>());
        return services;
    }

    /// <summary>
    /// Registers a service with a single implementation: the mock when
    /// <c>Integraciones:&lt;nombre&gt;:UsarMock</c> is true, the real HTTP client when it is false.
    /// </summary>
    public static IServiceCollection AgregarIntegracion<TInterfaz, TMock, TReal>(
        this IServiceCollection services,
        IConfiguration configuration,
        string nombre)
        where TInterfaz : class
        where TMock : class, TInterfaz
        where TReal : class, TInterfaz
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);
        ArgumentException.ThrowIfNullOrWhiteSpace(nombre);

        var opciones = Leer<IntegracionOptions>(configuration, nombre);
        RegistrarOpciones<IntegracionOptions>(services, configuration, nombre);

        if (opciones.UsarMock)
        {
            services.AddScoped<TInterfaz, TMock>();
            return services;
        }

        services.AddHttpClient<TReal>(client =>
            {
                // Validation reports the exact key when BaseUrl is missing; do not throw here.
                if (Uri.TryCreate(opciones.BaseUrl, UriKind.Absolute, out var baseUri))
                    client.BaseAddress = baseUri;
            })
            .AgregarResiliencia(opciones);
        services.AddScoped<TInterfaz>(provider => provider.GetRequiredService<TReal>());
        return services;
    }

    /// <summary>
    /// Registers a named client with the shared resilience and returns it, for services with one
    /// implementation per provider (Frente 4's gateways). F4 can hang its typed client off the
    /// returned builder with <c>AddTypedClient</c> or resolve it by name from
    /// <see cref="IHttpClientFactory"/>.
    /// </summary>
    public static IHttpClientBuilder AgregarClienteResiliente<TOpciones>(
        this IServiceCollection services,
        IConfiguration configuration,
        string seccion)
        where TOpciones : IntegracionOptions, new()
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);
        ArgumentException.ThrowIfNullOrWhiteSpace(seccion);

        var opciones = Leer<TOpciones>(configuration, seccion);
        RegistrarOpciones<TOpciones>(services, configuration, seccion);

        return services
            .AddHttpClient(seccion, client =>
            {
                if (!string.IsNullOrWhiteSpace(opciones.BaseUrl))
                    client.BaseAddress = new Uri(opciones.BaseUrl, UriKind.Absolute);
            })
            .AgregarResiliencia(opciones);
    }

    private static TOpciones Leer<TOpciones>(IConfiguration configuration, string seccion)
        where TOpciones : new()
        => configuration.GetSection(IntegracionOptions.Seccion(seccion)).Get<TOpciones>() ?? new TOpciones();

    private static void RegistrarOpciones<TOpciones>(
        IServiceCollection services,
        IConfiguration configuration,
        string seccion)
        where TOpciones : IntegracionOptions
    {
        services.AddOptions<TOpciones>(seccion)
            .Bind(configuration.GetSection(IntegracionOptions.Seccion(seccion)))
            .ValidateOnStart();

        services.TryAddEnumerable(
            ServiceDescriptor.Singleton<IValidateOptions<TOpciones>, IntegracionOptionsValidator<TOpciones>>());
    }
}
