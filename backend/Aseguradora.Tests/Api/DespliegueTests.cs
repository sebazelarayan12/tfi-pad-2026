using System.Net;
using Aseguradora.Api.Comandos;
using Microsoft.Extensions.DependencyInjection;

namespace Aseguradora.Tests.Api;

/// <summary>Deployment switches of US-T-05 that need no Docker: Swagger flag, TimeProvider and --migrar.</summary>
public class DespliegueTests
{
    private const string Development = "Development";
    private const string Production = "Production";

    [Fact]
    public async Task Swagger_EnProduction_PorDefecto_RetornaNotFound()
    {
        await using var factory = new ApiFactory(Production);

        var respuesta = await factory.CreateClient().GetAsync("/swagger/index.html");

        Assert.Equal(HttpStatusCode.NotFound, respuesta.StatusCode);
    }

    [Fact]
    public async Task Swagger_EnProduction_HabilitadoPorFlag_Responde200()
    {
        await using var factory = new ApiFactory(Production, new Dictionary<string, string>
        {
            ["Swagger:Habilitado"] = "true"
        });

        var respuesta = await factory.CreateClient().GetAsync("/swagger/index.html");

        Assert.Equal(HttpStatusCode.OK, respuesta.StatusCode);
    }

    [Fact]
    public async Task Swagger_EnDevelopment_DeshabilitadoPorFlag_RetornaNotFound()
    {
        await using var factory = new ApiFactory(Development, new Dictionary<string, string>
        {
            ["Swagger:Habilitado"] = "false"
        });

        var respuesta = await factory.CreateClient().GetAsync("/swagger/v1/swagger.json");

        Assert.Equal(HttpStatusCode.NotFound, respuesta.StatusCode);
    }

    [Fact]
    public async Task TimeProvider_EsSingletonDelSistema()
    {
        await using var factory = new ApiFactory(Production);

        var primero = factory.Services.GetRequiredService<TimeProvider>();
        var segundo = factory.Services.GetRequiredService<TimeProvider>();

        Assert.Same(TimeProvider.System, primero);
        Assert.Same(primero, segundo);
    }

    [Theory]
    [InlineData("--migrar", true)]
    [InlineData("--otro", false)]
    public void Migrar_Solicitado_SoloConElArgumentoExacto(string argumento, bool esperado)
    {
        Assert.Equal(esperado, MigracionComando.Solicitado([argumento]));
        Assert.False(MigracionComando.Solicitado([]));
    }

    [Fact]
    public async Task Migrar_SinBaseDisponible_TerminaConUno()
    {
        await using var factory = new ApiFactory(Production);

        var codigo = await MigracionComando.EjecutarAsync(factory.Services);

        Assert.Equal(1, codigo);
    }
}
