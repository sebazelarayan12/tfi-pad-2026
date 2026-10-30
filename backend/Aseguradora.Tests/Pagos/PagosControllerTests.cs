using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Aseguradora.Application.Dtos;
using Aseguradora.Application.Security;
using Aseguradora.Data;
using Aseguradora.Data.Seed;
using Aseguradora.Domain.Enums;
using Aseguradora.Tests.Data;
using Aseguradora.Tests.Fixtures;
using Aseguradora.Tests.Support;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Aseguradora.Tests.Pagos;

public sealed class PagosControllerTests : IDisposable
{
    private readonly SqliteDbFixture _sqlite = new();
    private readonly AseguradoraWebFactory _factory;
    public PagosControllerTests()
    {
        using var db = _sqlite.CreateContext();
        ServiciosPagoDePrueba.AgregarFacturaSeed(db);
        _factory = CrearFactory();
    }
    private AseguradoraWebFactory CrearFactory(bool autenticacionReal = false) => new()
    {
        UsarAutenticacionReal = autenticacionReal,
        ConfigurarServicios = (_, services) =>
        {
            services.RemoveAll<DbContextOptions<AseguradoraDbContext>>();
            services.RemoveAll<AseguradoraDbContext>();
            services.AddScoped<AseguradoraDbContext>(_ => _sqlite.CreateContext());
        }
    };
    public void Dispose() { _factory.Dispose(); _sqlite.Dispose(); }

    [Theory]
    [InlineData(Roles.Empleado)]
    [InlineData(Roles.Administrador)]
    public async Task Caja_CuotasValidas_201ConLocationYFactura(string rol)
    {
        using var cliente = _factory.CrearCliente(rol);
        var respuesta = await cliente.PostAsJsonAsync("/api/pagos/caja", new { cuotaIds = new[] { SeedData.CuotaId(2) } });
        Assert.Equal(HttpStatusCode.Created, respuesta.StatusCode);
        var pago = await respuesta.Content.ReadFromJsonAsync<PagoResponse>();
        Assert.NotNull(pago);
        Assert.Equal("APROBADO", pago.Estado);
        Assert.Equal("CAJA", pago.Medio);
        Assert.NotNull(pago.Factura);
        Assert.EndsWith($"/api/pagos/{pago.Id}", respuesta.Headers.Location?.ToString());
        var consulta = await cliente.GetFromJsonAsync<PagoResponse>(respuesta.Headers.Location);
        Assert.Equal(pago, consulta);
        var factura = await cliente.GetFromJsonAsync<FacturaResponse>($"/api/pagos/{pago.Id}/factura");
        Assert.Equal(pago.Factura, factura);
        Assert.Equal("AUTORIZADA", factura!.Estado);
        Assert.False(string.IsNullOrWhiteSpace(factura.Numero));
        Assert.Matches("^[0-9]{14}$", factura.Cae!);
        Assert.NotNull(factura.VencimientoCae);
        await using var db = _sqlite.CreateContext();
        Assert.Equal(EstadoCuota.Pagada, (await db.Cuotas.FindAsync(SeedData.CuotaId(2)))!.Estado);
    }

    [Theory]
    [InlineData("pagada")]
    [InlineData("vacia")]
    [InlineData("repetida")]
    [InlineData("null")]
    public async Task Caja_CuotasInvalidas_400(string caso)
    {
        Guid[]? ids = caso switch
        {
            "pagada" => [SeedData.CuotaId(1)],
            "repetida" => [SeedData.CuotaId(2), SeedData.CuotaId(2)],
            "null" => null,
            _ => []
        };
        using var cliente = _factory.CrearCliente(Roles.Empleado);
        Assert.Equal(HttpStatusCode.BadRequest,
            (await cliente.PostAsJsonAsync("/api/pagos/caja", new { cuotaIds = ids })).StatusCode);
    }

    [Fact]
    public async Task Caja_CuotaInexistente_404()
    {
        using var cliente = _factory.CrearCliente(Roles.Empleado);
        Assert.Equal(HttpStatusCode.NotFound,
            (await cliente.PostAsJsonAsync("/api/pagos/caja", new { cuotaIds = new[] { Guid.NewGuid() } })).StatusCode);
    }

    [Theory]
    [InlineData("")]
    [InlineData("/factura")]
    public async Task Consultar_PagoInexistente_404(string sufijo)
    {
        using var cliente = _factory.CrearCliente(Roles.Empleado);
        Assert.Equal(HttpStatusCode.NotFound, (await cliente.GetAsync($"/api/pagos/{Guid.NewGuid()}{sufijo}")).StatusCode);
    }

    [Fact]
    public async Task Privados_SinSesion_401EnTodasLasRutas()
    {
        using var cliente = _factory.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await cliente.PostAsJsonAsync("/api/pagos/caja", new { cuotaIds = new[] { SeedData.CuotaId(2) } })).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await cliente.GetAsync($"/api/pagos/{SeedData.PagoId}")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await cliente.GetAsync($"/api/pagos/{SeedData.PagoId}/factura")).StatusCode);
    }

    [Fact]
    public async Task Privados_JwtValidoSinPermiso_403EnTodasLasRutas()
    {
        // TestAuthHandler rejects unknown roles with 401; a signed JWT exercises authorization (403).
        using var factory = CrearFactory(autenticacionReal: true);
        using var cliente = factory.CreateClient();
        cliente.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", TokenDePrueba.Token("Cliente"));
        Assert.Equal(HttpStatusCode.Forbidden, (await cliente.PostAsJsonAsync("/api/pagos/caja", new { cuotaIds = new[] { SeedData.CuotaId(2) } })).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await cliente.GetAsync($"/api/pagos/{SeedData.PagoId}")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await cliente.GetAsync($"/api/pagos/{SeedData.PagoId}/factura")).StatusCode);
    }

    [Fact]
    public async Task Publica_DniYNumeroCorrectos_200SinSesion()
    {
        using var cliente = _factory.CreateClient();
        var respuesta = await cliente.PostAsJsonAsync("/api/publico/factura", new { dni = "30123456", numeroPago = "PAG-000001" });
        Assert.Equal(HttpStatusCode.OK, respuesta.StatusCode);
        Assert.Equal(SeedData.PagoId, (await respuesta.Content.ReadFromJsonAsync<FacturaResponse>())!.PagoId);
    }

    [Fact]
    public async Task Publica_DniONumeroIncorrectos_404Identico()
    {
        using var cliente = _factory.CreateClient();
        var dni = await cliente.PostAsJsonAsync("/api/publico/factura", new { dni = "99999999", numeroPago = "PAG-000001" });
        var numero = await cliente.PostAsJsonAsync("/api/publico/factura", new { dni = "30123456", numeroPago = "PAG-ffffff" });
        Assert.Equal(HttpStatusCode.NotFound, dni.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, numero.StatusCode);
        Assert.Equal((await dni.Content.ReadFromJsonAsync<ProblemDetails>())!.Detail,
            (await numero.Content.ReadFromJsonAsync<ProblemDetails>())!.Detail);
    }
}
