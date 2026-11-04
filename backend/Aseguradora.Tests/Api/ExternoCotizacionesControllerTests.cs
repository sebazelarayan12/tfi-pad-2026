using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Aseguradora.Data;
using Aseguradora.Tests.Application;
using Aseguradora.Tests.Data;
using Aseguradora.Tests.Fixtures;
using Aseguradora.Tests.Support;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Aseguradora.Tests.Api;

public sealed class ExternoCotizacionesControllerTests : IDisposable
{
    private const string Ruta = "/api/externo/cotizaciones";
    private const string Pedido = """{"tipoVehiculo":"MOTO","anio":2024,"uso":"PARTICULAR","edadConductor":23}""";
    private readonly SqliteDbFixture _sqlite = new();
    private readonly AseguradoraWebFactory _factory;

    public ExternoCotizacionesControllerTests()
    {
        _factory = new AseguradoraWebFactory
        {
            UsarAutenticacionReal = true,
            Ajustes = { ["Swagger:Habilitado"] = "true" },
            ConfigurarServicios = (_, servicios) =>
            {
                servicios.RemoveAll<DbContextOptions<AseguradoraDbContext>>();
                servicios.RemoveAll<AseguradoraDbContext>();
                servicios.AddScoped<AseguradoraDbContext>(_ => _sqlite.CreateContext());
                servicios.RemoveAll<TimeProvider>();
                servicios.AddSingleton<TimeProvider>(new RelojFalso(CotizacionExternaServiceTests.Ahora));
            }
        };
    }

    public void Dispose()
    {
        _factory.Dispose();
        _sqlite.Dispose();
    }

    private HttpClient ClienteConApiKey()
    {
        var cliente = _factory.CreateClient();
        cliente.DefaultRequestHeaders.Add(TokenDePrueba.ApiKeyHeader, TokenDePrueba.ApiKeyValida(TokenDePrueba.ProveedorValido));
        return cliente;
    }

    private static StringContent Contenido(string json) => new(json, Encoding.UTF8, "application/json");

    [Fact]
    public async Task POST_sin_api_key_devuelve_401()
    {
        using var cliente = _factory.CreateClient();
        var respuesta = await cliente.PostAsync(Ruta, Contenido(Pedido));
        Assert.Equal(HttpStatusCode.Unauthorized, respuesta.StatusCode);
    }

    [Fact]
    public async Task POST_con_api_key_invalida_devuelve_401()
    {
        using var cliente = _factory.CreateClient();
        cliente.DefaultRequestHeaders.Add(TokenDePrueba.ApiKeyHeader, "clave-incorrecta");
        var respuesta = await cliente.PostAsync(Ruta, Contenido(Pedido));
        Assert.Equal(HttpStatusCode.Unauthorized, respuesta.StatusCode);
    }

    [Theory]
    [InlineData("PARTICULAR")]
    [InlineData("COMERCIAL")]
    public async Task POST_con_api_key_valida_devuelve_201_con_contrato_9_5_C(string uso)
    {
        await using var contexto = _sqlite.CreateContext();
        await CotizacionExternaServiceTests.PrepararPlanes(contexto);
        using var cliente = ClienteConApiKey();
        var respuesta = await cliente.PostAsync(Ruta, Contenido(Pedido.Replace("PARTICULAR", uso)));
        Assert.Equal(HttpStatusCode.Created, respuesta.StatusCode);
        using var documento = JsonDocument.Parse(await respuesta.Content.ReadAsStringAsync());
        var raiz = documento.RootElement;
        Assert.Equal(new[] { "fechaVencimiento", "opciones" }, raiz.EnumerateObject().Select(p => p.Name).ToArray());
        Assert.Equal(CotizacionExternaServiceTests.Ahora.UtcDateTime.AddDays(15), raiz.GetProperty("fechaVencimiento").GetDateTime());
        var opciones = raiz.GetProperty("opciones").EnumerateArray().ToArray();
        Assert.Equal(2, opciones.Length);
        var factor = uso == "COMERCIAL" ? 1.40m : 1m;
        Assert.Equal(new[] { 9100m * factor, 16380m * factor }, opciones.Select(o => o.GetProperty("primaMensual").GetDecimal()).ToArray());
        Assert.Equal(new[] { "RC", "TC" }, opciones.Select(o => o.GetProperty("codigoPlan").GetString()).ToArray());
        await using var lectura = _sqlite.CreateContext();
        foreach (var opcion in opciones)
        {
            Assert.Equal(new[] { "idCotizacion", "codigoPlan", "plan", "primaMensual" }, opcion.EnumerateObject().Select(p => p.Name).ToArray());
            var guardada = await lectura.Cotizaciones.SingleAsync(c => c.Id == opcion.GetProperty("idCotizacion").GetGuid());
            Assert.Null(guardada.ClienteId);
            Assert.Null(guardada.VehiculoId);
        }
    }

    [Theory]
    [InlineData("tipoVehiculo", "\"BICICLETA\"")]
    [InlineData("tipoVehiculo", "\"moto\"")]
    [InlineData("tipoVehiculo", "1")]
    [InlineData("uso", "\"particular\"")]
    [InlineData("uso", "\"DESCONOCIDO\"")]
    [InlineData("uso", "0")]
    public async Task POST_con_enum_invalido_devuelve_400(string campo, string valor)
    {
        var body = JsonNode.Parse(Pedido)!;
        body[campo] = JsonNode.Parse(valor);
        await Verificar400(body.ToJsonString());
    }

    [Theory]
    [InlineData("tipoVehiculo")]
    [InlineData("anio")]
    [InlineData("uso")]
    [InlineData("edadConductor")]
    public async Task POST_con_campo_omitido_o_null_devuelve_400(string campo)
    {
        var body = JsonNode.Parse(Pedido)!.AsObject();
        body.Remove(campo);
        await Verificar400(body.ToJsonString());
        body[campo] = null;
        await Verificar400(body.ToJsonString());
    }

    [Theory]
    [InlineData("edadConductor", -1)]
    [InlineData("edadConductor", 121)]
    [InlineData("anio", 1899)]
    [InlineData("anio", 2028)]
    public async Task POST_con_rango_invalido_devuelve_400(string campo, int valor)
    {
        var body = JsonNode.Parse(Pedido)!;
        body[campo] = valor;
        await Verificar400(body.ToJsonString());
    }

    [Fact]
    public async Task POST_sin_planes_compatibles_devuelve_400()
    {
        await using var contexto = _sqlite.CreateContext();
        foreach (var plan in await contexto.Planes.ToListAsync())
            plan.Activo = false;
        await contexto.SaveChangesAsync();
        await Verificar400(Pedido);
    }

    [Fact]
    public async Task Swagger_documenta_enums_externos_en_mayusculas()
    {
        using var cliente = _factory.CreateClient();
        using var documento = JsonDocument.Parse(await cliente.GetStringAsync("/swagger/v1/swagger.json"));
        var raiz = documento.RootElement;
        var propiedades = raiz.GetProperty("components").GetProperty("schemas")
            .GetProperty("CotizacionExternaBody").GetProperty("properties");
        Assert.Equal("string", propiedades.GetProperty("tipoVehiculo").GetProperty("type").GetString());
        Assert.Equal(new[] { "AUTO", "MOTO", "CAMIONETA" }, propiedades.GetProperty("tipoVehiculo")
            .GetProperty("enum").EnumerateArray().Select(v => v.GetString()).ToArray());
        Assert.Equal(new[] { "PARTICULAR", "COMERCIAL" }, propiedades.GetProperty("uso")
            .GetProperty("enum").EnumerateArray().Select(v => v.GetString()).ToArray());
        var operacion = raiz.GetProperty("paths").GetProperty(Ruta).GetProperty("post");
        Assert.True(operacion.GetProperty("responses").TryGetProperty("201", out _));
        Assert.NotEmpty(operacion.GetProperty("security").EnumerateArray());
    }

    private async Task Verificar400(string json)
    {
        await using var contexto = _sqlite.CreateContext();
        var cantidad = await contexto.Cotizaciones.CountAsync();
        using var cliente = ClienteConApiKey();
        var respuesta = await cliente.PostAsync(Ruta, Contenido(json));
        Assert.Equal(HttpStatusCode.BadRequest, respuesta.StatusCode);
        Assert.Equal("application/problem+json", respuesta.Content.Headers.ContentType?.MediaType);
        using var documento = JsonDocument.Parse(await respuesta.Content.ReadAsStringAsync());
        Assert.Equal(400, documento.RootElement.GetProperty("status").GetInt32());
        Assert.Equal(cantidad, await contexto.Cotizaciones.CountAsync());
    }
}
