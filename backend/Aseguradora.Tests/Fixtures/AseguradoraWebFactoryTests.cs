using System.Net;
using Aseguradora.Application.Security;
using Aseguradora.Integrations.Configuration;
using Aseguradora.Tests.Integrations;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.DependencyInjection;
using Aseguradora.Integrations;
using Aseguradora.Tests.Support;
using System.Net.Http.Headers;

namespace Aseguradora.Tests.Fixtures;

/// <summary>
/// Acceptance criteria of US-T-03 that need no Docker: the shared factory, its forced mocks and
/// the test authentication that stands in for the Bearer scheme.
/// </summary>
public class AseguradoraWebFactoryTests
{
    private const string ProbeEmpleado = "/api/probe/empleado";
    private const string ProbeAdmin = "/api/probe/admin";

    [Fact]
    public void Factory_ConMockForzado_ResuelveMockAunqueConfigDigaReal()
    {
        // The configuration asks for the real client; the factory must still hand out the mock.
        // IRenaperService does not exist yet (US-F1-04), so the stand-in service of the
        // integration tests is registered under the same section name.
        using var factory = new AseguradoraWebFactory
        {
            Ajustes = { [$"{IntegracionOptions.Prefix}:Renaper:UsarMock"] = "false" },
            ConfigurarServicios = (configuracion, services) =>
                services.AgregarIntegracion<IServicioFalso, MockFalso, RealFalso>(configuracion, "Renaper")
        };

        using var scope = factory.Services.CreateScope();
        var servicio = scope.ServiceProvider.GetRequiredService<IServicioFalso>();

        Assert.IsType<MockFalso>(servicio);
    }

    [Fact]
    public async Task Factory_UsarAutenticacionRealTrue_NoReemplazaBearer()
    {
        await using var real = new AseguradoraWebFactory { UsarAutenticacionReal = true };
        await using var prueba = new AseguradoraWebFactory();

        Assert.Equal(typeof(JwtBearerHandler), await HandlerBearerAsync(real));
        Assert.Equal(typeof(TestAuthHandler), await HandlerBearerAsync(prueba));

        // With the real scheme the test header grants nothing; a signed JWT does.
        var cliente = real.CreateClient();
        cliente.DefaultRequestHeaders.Add(TestAuthHandler.HeaderRol, Roles.Administrador);
        Assert.Equal(HttpStatusCode.Unauthorized, (await cliente.GetAsync(ProbeAdmin)).StatusCode);

        cliente.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", TokenDePrueba.Token(Roles.Administrador));
        Assert.Equal(HttpStatusCode.OK, (await cliente.GetAsync(ProbeAdmin)).StatusCode);
    }

    [Fact]
    public async Task CrearCliente_ConRolEmpleado_LlegaAutenticadoComoEmpleado()
    {
        await using var factory = new AseguradoraWebFactory();
        var cliente = factory.CrearCliente(Roles.Empleado);

        Assert.Equal(HttpStatusCode.OK, (await cliente.GetAsync(ProbeEmpleado)).StatusCode);
        // The role is Empleado, not Administrador: the real Admin policy still refuses it.
        Assert.Equal(HttpStatusCode.Forbidden, (await cliente.GetAsync(ProbeAdmin)).StatusCode);
    }

    [Fact]
    public async Task TestAuthHandler_RolInvalido_Responde401()
    {
        await using var factory = new AseguradoraWebFactory();
        var inexistente = factory.CrearCliente("Inexistente");
        var anonimo = factory.CreateClient();

        Assert.Equal(HttpStatusCode.Unauthorized, (await inexistente.GetAsync(ProbeEmpleado)).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonimo.GetAsync(ProbeEmpleado)).StatusCode);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void CrearCliente_ConRolNuloOVacio_LanzaArgumentException(string? rol)
    {
        using var factory = new AseguradoraWebFactory();

        Assert.ThrowsAny<ArgumentException>(() => factory.CrearCliente(rol!));
    }

    [Fact]
    public void CrearCliente_ConAutenticacionReal_Lanza()
    {
        using var factory = new AseguradoraWebFactory { UsarAutenticacionReal = true };

        Assert.Throws<InvalidOperationException>(() => factory.CrearCliente(Roles.Empleado));
    }

    [Fact]
    public void Opciones_DespuesDelPrimerCliente_Lanzan()
    {
        using var factory = new AseguradoraWebFactory();
        using var _ = factory.CreateClient();

        Assert.Throws<InvalidOperationException>(() => factory.UsarAutenticacionReal = true);
    }

    [Fact]
    public void UsarBase_ConContenedorNulo_LanzaArgumentNullException()
    {
        using var factory = new AseguradoraWebFactory();

        Assert.Throws<ArgumentNullException>(() => factory.UsarBase(null!));
    }

    private static async Task<Type?> HandlerBearerAsync(AseguradoraWebFactory factory)
    {
        var esquemas = factory.Services.GetRequiredService<IAuthenticationSchemeProvider>();
        return (await esquemas.GetSchemeAsync(JwtBearerDefaults.AuthenticationScheme))?.HandlerType;
    }
}
