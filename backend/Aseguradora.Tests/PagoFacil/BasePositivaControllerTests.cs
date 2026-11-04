using System.Net;
using Aseguradora.Application.PagoFacil;
using Aseguradora.Application.Security;
using Aseguradora.Data;
using Aseguradora.Tests.Data;
using Aseguradora.Tests.Fixtures;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Aseguradora.Tests.PagoFacil;

public sealed class BasePositivaControllerTests : IDisposable
{
    private const string Ruta = "/api/pagofacil/base-positiva";

    private readonly SqliteDbFixture _sqlite = new();
    private readonly AseguradoraWebFactory _factory;

    public BasePositivaControllerTests()
    {
        _factory = new AseguradoraWebFactory
        {
            ConfigurarServicios = (_, services) =>
            {
                services.RemoveAll<DbContextOptions<AseguradoraDbContext>>();
                services.RemoveAll<AseguradoraDbContext>();
                services.AddScoped<AseguradoraDbContext>(_ => _sqlite.CreateContext());
            }
        };
        _factory.Ajustes[$"{PagoFacilOpciones.Seccion}:{nameof(PagoFacilOpciones.CodigoEmpresa)}"] = "12345";
    }

    public void Dispose()
    {
        _factory.Dispose();
        _sqlite.Dispose();
    }

    [Fact]
    public async Task Get_200_TextPlainAdjunto()
    {
        var response = await _factory.CrearCliente(Roles.Empleado).GetAsync(Ruta);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("text/plain", response.Content.Headers.ContentType?.MediaType);
        var disposicion = response.Content.Headers.ContentDisposition;
        Assert.NotNull(disposicion);
        Assert.Equal("attachment", disposicion.DispositionType);
        Assert.StartsWith("BASEPOS_12345_", disposicion.FileName);

        var lineas = (await response.Content.ReadAsStringAsync())
            .Split(LayoutBasePositivaPagoFacil.FinDeLinea, StringSplitOptions.RemoveEmptyEntries);
        // Header, the 5 Pendiente installments of the seeded policy and the trailer.
        Assert.Equal(7, lineas.Length);
        Assert.All(lineas, l => Assert.Equal(LayoutBasePositivaPagoFacil.LongitudRegistro, l.Length));
    }

    [Fact]
    public async Task Get_SinToken_401()
    {
        var response = await _factory.CreateClient().GetAsync(Ruta);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
