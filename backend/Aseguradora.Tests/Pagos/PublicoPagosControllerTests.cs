using System.Net;
using System.Net.Http.Json;
using Aseguradora.Application.Dtos;
using Aseguradora.Application.Publico;
using Aseguradora.Data;
using Aseguradora.Data.Seed;
using Aseguradora.Tests.Data;
using Aseguradora.Tests.Fixtures;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Aseguradora.Tests.Pagos;

public sealed class PublicoPagosControllerTests : IDisposable
{
    private const string Ruta = "/api/publico/pagos";

    private readonly SqliteDbFixture _sqlite = new();
    private readonly AseguradoraWebFactory _factory;

    public PublicoPagosControllerTests()
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
    }

    public void Dispose()
    {
        _factory.Dispose();
        _sqlite.Dispose();
    }

    private static object Cuerpo(string dni = "30123456", string poliza = "POL-0000001", string proveedor = "pasarela1") =>
        new { dni, numeroPoliza = poliza, cuotaIds = new[] { SeedData.CuotaId(2) }, proveedor };

    [Fact]
    public async Task Post_DatosValidos_201ConElLinkDePago()
    {
        // Anonymous on purpose: RN20 protects this route with the rate limit, not with a token.
        var respuesta = await _factory.CreateClient().PostAsJsonAsync(Ruta, Cuerpo());

        Assert.Equal(HttpStatusCode.Created, respuesta.StatusCode);
        var pago = await respuesta.Content.ReadFromJsonAsync<PagoPublicoResponse>();
        Assert.NotNull(pago);
        Assert.StartsWith("PAG-", pago.NumeroPago);
        Assert.False(string.IsNullOrWhiteSpace(pago.UrlPago));
        Assert.NotEqual(Guid.Empty, pago.IdPago);
    }

    [Fact]
    public async Task Post_DniQueNoCoincide_404ConMensajeGenerico()
    {
        var respuesta = await _factory.CreateClient().PostAsJsonAsync(Ruta, Cuerpo(dni: "99999999"));

        Assert.Equal(HttpStatusCode.NotFound, respuesta.StatusCode);
        var problema = await respuesta.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.Equal(VerificadorPublico.MensajeNoEncontrado, problema?.Detail);
    }

    [Fact]
    public async Task Post_ProveedorDesconocido_400()
    {
        var respuesta = await _factory.CreateClient().PostAsJsonAsync(Ruta, Cuerpo(proveedor: "pasarela3"));

        Assert.Equal(HttpStatusCode.BadRequest, respuesta.StatusCode);
    }

    [Fact]
    public async Task Post_SinCamposObligatorios_400PorValidacion()
    {
        var respuesta = await _factory.CreateClient().PostAsJsonAsync(Ruta, new { dni = "30123456" });

        Assert.Equal(HttpStatusCode.BadRequest, respuesta.StatusCode);
    }

    [Fact]
    public async Task Post_SinCuotas_400PorValidacion()
    {
        var cuerpo = new { dni = "30123456", numeroPoliza = "POL-0000001", cuotaIds = Array.Empty<Guid>(), proveedor = "pasarela1" };

        var respuesta = await _factory.CreateClient().PostAsJsonAsync(Ruta, cuerpo);

        Assert.Equal(HttpStatusCode.BadRequest, respuesta.StatusCode);
    }
}
