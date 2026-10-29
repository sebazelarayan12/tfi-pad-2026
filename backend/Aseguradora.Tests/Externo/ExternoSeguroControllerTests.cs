using System.Net;
using System.Net.Http.Json;
using Aseguradora.Application.Dtos.Externo;
using Aseguradora.Data;
using Aseguradora.Data.Seed;
using Aseguradora.Domain.Enums;
using Aseguradora.Tests.Data;
using Aseguradora.Tests.Fixtures;
using Aseguradora.Tests.Support;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Aseguradora.Tests.Externo;

/// <summary>The real ApiKey scheme stays active (C16); the clock is fixed inside the seeded policy's dates.</summary>
public sealed class ExternoSeguroControllerTests : IDisposable
{
    // 2026-11-20 12:00 in Argentina.
    private static readonly DateTimeOffset Ahora = new(2026, 11, 20, 15, 0, 0, TimeSpan.Zero);

    private readonly SqliteDbFixture _sqlite = new();
    private readonly AseguradoraWebFactory _factory;

    public ExternoSeguroControllerTests()
    {
        _factory = new AseguradoraWebFactory
        {
            ConfigurarServicios = (_, services) =>
            {
                services.RemoveAll<DbContextOptions<AseguradoraDbContext>>();
                services.RemoveAll<AseguradoraDbContext>();
                services.AddScoped<AseguradoraDbContext>(_ => _sqlite.CreateContext());
                services.RemoveAll<TimeProvider>();
                services.AddSingleton<TimeProvider>(new RelojFalso(Ahora));
            }
        };
    }

    public void Dispose()
    {
        _factory.Dispose();
        _sqlite.Dispose();
    }

    private static string Ruta(string patente) => $"/api/externo/vehiculos/{patente}/seguro-vigente";

    private HttpClient ClienteConApiKey()
    {
        var cliente = _factory.CreateClient();
        cliente.DefaultRequestHeaders.Add(TokenDePrueba.ApiKeyHeader, TokenDePrueba.ApiKeyValida(TokenDePrueba.ProveedorValido));
        return cliente;
    }

    [Fact]
    public async Task Get_ConSeguro_200()
    {
        var response = await ClienteConApiKey().GetAsync(Ruta("ab123cd"));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var seguro = await response.Content.ReadFromJsonAsync<SeguroVigenteResponse>();
        Assert.NotNull(seguro);
        Assert.True(seguro.TieneSeguro);
        Assert.Equal("AB123CD", seguro.Patente);
        Assert.Equal("POL-0000001", seguro.NumeroPoliza);
        Assert.Equal("Responsabilidad Civil", seguro.Plan);
        Assert.Equal(new DateOnly(2026, 10, 15), seguro.VigenteDesde);
        Assert.Equal(new DateOnly(2027, 4, 15), seguro.VigenteHasta);
    }

    [Fact]
    public async Task Get_SinSeguro_200False()
    {
        await using (var context = _sqlite.CreateContext())
        {
            var poliza = await context.Polizas.FindAsync(SeedData.PolizaId);
            poliza!.Estado = EstadoPoliza.Suspendida;
            await context.SaveChangesAsync();
        }

        var seguro = await ConsultarOkAsync("AB123CD");

        Assert.False(seguro.TieneSeguro);
        Assert.Null(seguro.NumeroPoliza);
        Assert.Null(seguro.Plan);
        Assert.Null(seguro.VigenteDesde);
        Assert.Null(seguro.VigenteHasta);
    }

    [Fact]
    public async Task Get_PatenteInexistente_200False() =>
        Assert.False((await ConsultarOkAsync("ZZ999ZZ")).TieneSeguro);

    [Theory]
    [InlineData("AB123")]
    [InlineData("1234567")]
    public async Task Get_FormatoInvalido_400(string patente)
    {
        var response = await ClienteConApiKey().GetAsync(Ruta(patente));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Get_SinApiKey_401()
    {
        var response = await _factory.CreateClient().GetAsync(Ruta("AB123CD"));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Get_ApiKeyIncorrecta_401()
    {
        var cliente = _factory.CreateClient();
        cliente.DefaultRequestHeaders.Add(TokenDePrueba.ApiKeyHeader, "clave-incorrecta");

        var response = await cliente.GetAsync(Ruta("AB123CD"));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Get_RespuestaSinDatosDelTitular()
    {
        var response = await ClienteConApiKey().GetAsync(Ruta("AB123CD"));
        var json = await response.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        foreach (var dato in new[] { "dni", "cliente", "nombre", "apellido", "email", "titular" })
            Assert.DoesNotContain(dato, json, StringComparison.OrdinalIgnoreCase);
    }

    private async Task<SeguroVigenteResponse> ConsultarOkAsync(string patente)
    {
        var response = await ClienteConApiKey().GetAsync(Ruta(patente));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var seguro = await response.Content.ReadFromJsonAsync<SeguroVigenteResponse>();
        Assert.NotNull(seguro);
        return seguro;
    }
}
