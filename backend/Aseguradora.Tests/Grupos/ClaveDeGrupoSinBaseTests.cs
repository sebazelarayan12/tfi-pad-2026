using System.Net;
using Aseguradora.Tests.Fixtures;
using Aseguradora.Tests.Support;

namespace Aseguradora.Tests.Grupos;

/// <summary>The host runs with an unreachable database (the default of the factory).</summary>
public class ClaveDeGrupoSinBaseTests
{
    [Fact]
    public async Task Con_la_base_caida_una_clave_de_grupo_responde_401_y_no_500()
    {
        await using var factory = new AseguradoraWebFactory { UsarAutenticacionReal = true };
        var cliente = factory.CreateClient();
        cliente.DefaultRequestHeaders.Add(TokenDePrueba.ApiKeyHeader, "nxk_cualquier-clave");

        var respuesta = await cliente.GetAsync("/api/probe/apikey");

        Assert.Equal(HttpStatusCode.Unauthorized, respuesta.StatusCode);
    }

    [Fact]
    public async Task Las_claves_configuradas_siguen_funcionando_sin_tocar_la_base()
    {
        await using var factory = new AseguradoraWebFactory { UsarAutenticacionReal = true };
        var cliente = factory.CreateClient();
        cliente.DefaultRequestHeaders.Add(TokenDePrueba.ApiKeyHeader, TokenDePrueba.ApiKeyValida("pasarela1"));

        var respuesta = await cliente.GetAsync("/api/probe/apikey");

        Assert.Equal(HttpStatusCode.OK, respuesta.StatusCode);
    }
}
