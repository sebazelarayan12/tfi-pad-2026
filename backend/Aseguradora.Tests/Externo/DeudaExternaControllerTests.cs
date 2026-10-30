using System.Net;
using System.Text.Json;
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

/// <summary>
/// Contract of GET /api/externo/clientes/{dni}/deuda (spec 9.5 B) with the real ApiKey scheme (C16).
/// The seed client 30123456 has installments 2 to 6 Pendiente at 12000.00 each, and 1 Pagada.
/// </summary>
public sealed class DeudaExternaControllerTests : IDisposable
{
    private const string Dni = "30123456";

    private readonly SqliteDbFixture _sqlite = new();
    private readonly AseguradoraWebFactory _factory;

    public DeudaExternaControllerTests()
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

    private static string Ruta(string dni) => $"/api/externo/clientes/{dni}/deuda";

    private HttpClient ClienteConApiKey()
    {
        var cliente = _factory.CreateClient();
        cliente.DefaultRequestHeaders.Add(TokenDePrueba.ApiKeyHeader, TokenDePrueba.ApiKeyValida(TokenDePrueba.ProveedorValido));
        return cliente;
    }

    [Fact]
    public async Task Get_ConDeuda_200_UsaElContratoDeLaSpec()
    {
        await CambiarCuotaAsync(2, EstadoCuota.Vencida, recargo: 600.00m);

        var response = await ClienteConApiKey().GetAsync(Ruta(Dni));
        var json = await response.Content.ReadAsStringAsync();
        using var documento = JsonDocument.Parse(json);
        var raiz = documento.RootElement;

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(["dni", "cliente", "totalAdeudado", "polizas"], raiz.EnumerateObject().Select(p => p.Name).ToArray());
        Assert.Equal(Dni, raiz.GetProperty("dni").GetString());
        Assert.Equal("Juan Carlos Pérez", raiz.GetProperty("cliente").GetString());
        // Five unpaid installments: 4 x 12000.00, plus installment 2 at 12000.00 with a 600.00 surcharge.
        Assert.Contains("\"totalAdeudado\":60600.00", json);

        var poliza = Assert.Single(raiz.GetProperty("polizas").EnumerateArray());
        Assert.Equal(["numeroPoliza", "patente", "cuotas"], poliza.EnumerateObject().Select(p => p.Name).ToArray());
        Assert.Equal("POL-0000001", poliza.GetProperty("numeroPoliza").GetString());
        Assert.Equal("AB123CD", poliza.GetProperty("patente").GetString());

        var cuotas = poliza.GetProperty("cuotas").EnumerateArray().ToArray();
        Assert.Equal(5, cuotas.Length);
        Assert.Equal(
            ["idCuota", "numero", "importe", "recargo", "total", "vencimiento", "estado"],
            cuotas[0].EnumerateObject().Select(p => p.Name).ToArray());
        Assert.Equal(SeedData.CuotaId(2).ToString(), cuotas[0].GetProperty("idCuota").GetString());
        Assert.Equal(2, cuotas[0].GetProperty("numero").GetInt32());
        Assert.Equal("12000.00", cuotas[0].GetProperty("importe").GetRawText());
        Assert.Equal("600.00", cuotas[0].GetProperty("recargo").GetRawText());
        Assert.Equal("12600.00", cuotas[0].GetProperty("total").GetRawText());
        Assert.Equal("2026-12-10", cuotas[0].GetProperty("vencimiento").GetString());
        Assert.Equal("VENCIDA", cuotas[0].GetProperty("estado").GetString());
        Assert.Equal("PENDIENTE", cuotas[1].GetProperty("estado").GetString());
    }

    [Fact]
    public async Task Get_SinDeuda_200_TotalCeroYPolizasVacias()
    {
        for (var numero = 2; numero <= 6; numero++)
            await CambiarCuotaAsync(numero, EstadoCuota.Pagada);

        var response = await ClienteConApiKey().GetAsync(Ruta(Dni));
        var json = await response.Content.ReadAsStringAsync();
        using var documento = JsonDocument.Parse(json);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("0.00", documento.RootElement.GetProperty("totalAdeudado").GetRawText());
        Assert.Equal(JsonValueKind.Array, documento.RootElement.GetProperty("polizas").ValueKind);
        Assert.Empty(documento.RootElement.GetProperty("polizas").EnumerateArray());
    }

    [Fact]
    public async Task Get_DniInexistente_404ConCodigoClienteNoEncontrado()
    {
        var response = await ClienteConApiKey().GetAsync(Ruta("99999999"));
        using var documento = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var raiz = documento.RootElement;

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.StartsWith("application/problem+json", response.Content.Headers.ContentType?.ToString());
        Assert.Equal(404, raiz.GetProperty("status").GetInt32());
        Assert.Equal("CLIENTE_NO_ENCONTRADO", raiz.GetProperty("codigo").GetString());
    }

    [Fact]
    public async Task Get_SinApiKey_401()
    {
        var response = await _factory.CreateClient().GetAsync(Ruta(Dni));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Get_ApiKeyIncorrecta_401()
    {
        var cliente = _factory.CreateClient();
        cliente.DefaultRequestHeaders.Add(TokenDePrueba.ApiKeyHeader, "clave-incorrecta");

        var response = await cliente.GetAsync(Ruta(Dni));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    private async Task CambiarCuotaAsync(int numero, EstadoCuota estado, decimal? recargo = null)
    {
        await using var context = _sqlite.CreateContext();
        var cuota = await context.Cuotas.SingleAsync(c => c.Id == SeedData.CuotaId(numero));
        cuota.Estado = estado;
        if (recargo is not null)
            cuota.Recargo = recargo.Value;
        await context.SaveChangesAsync();
    }
}
