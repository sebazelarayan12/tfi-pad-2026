using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Aseguradora.Application.Publico;
using Aseguradora.Application.Publico.DTOs;
using Aseguradora.Data;
using Aseguradora.Data.Seed;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Tests.Data;
using Aseguradora.Tests.Fixtures;
using Aseguradora.Tests.Support;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Aseguradora.Tests.Api;

/// <summary>Integration tests of <c>POST /api/publico/consulta</c> over SQLite with the seed data (US-F1-08).</summary>
public sealed class PublicoConsultaControllerTests : IDisposable
{
    private const string Ruta = "/api/publico/consulta";
    private const string IpPorDefecto = "203.0.113.10";

    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    private readonly SqliteDbFixture _sqlite = new();
    private readonly AseguradoraWebFactory _factory;

    public PublicoConsultaControllerTests()
    {
        _factory = new AseguradoraWebFactory
        {
            ConfigurarServicios = (_, services) =>
            {
                services.RemoveAll<DbContextOptions<AseguradoraDbContext>>();
                services.RemoveAll<AseguradoraDbContext>();
                services.AddScoped<AseguradoraDbContext>(_ => _sqlite.CreateContext());
                services.AddSingleton<IStartupFilter>(new TestRemoteIpStartupFilter());
            }
        };
    }

    public void Dispose()
    {
        _factory.Dispose();
        _sqlite.Dispose();
    }

    private HttpClient CreateClientFromIp(string ip = IpPorDefecto)
    {
        var cliente = _factory.CreateClient();
        cliente.DefaultRequestHeaders.Add(TestRemoteIpStartupFilter.HeaderIp, ip);
        return cliente;
    }

    private static object Body(string dni = "30123456", string numero = "POL-0000001") =>
        new { dni, numeroPoliza = numero };

    private async Task ChangeSeededPolicyStateAsync(EstadoPoliza estado)
    {
        await using var contexto = _sqlite.CreateContext();
        var poliza = await contexto.Polizas.FindAsync(SeedData.PolizaId)
            ?? throw new InvalidOperationException("The seed has no policy POL-0000001.");
        poliza.Estado = estado;
        await contexto.SaveChangesAsync();
    }

    [Fact]
    public async Task Post_SeededVigentePolicy_Returns200WithCoverageAndInstallments()
    {
        var respuesta = await CreateClientFromIp().PostAsJsonAsync(Ruta, Body());

        Assert.Equal(HttpStatusCode.OK, respuesta.StatusCode);
        var consulta = await respuesta.Content.ReadFromJsonAsync<ConsultaPublicaResponse>(Json);
        Assert.NotNull(consulta);
        Assert.Equal("POL-0000001", consulta.NumeroPoliza);
        Assert.Equal("VIGENTE", consulta.Estado);
        Assert.True(consulta.CoberturaVigente);
        Assert.Equal(new DateOnly(2026, 10, 15), consulta.VigenteDesde);
        Assert.Equal(new DateOnly(2027, 4, 15), consulta.VigenteHasta);
        Assert.Equal(new PlanPublico("RC", "Responsabilidad Civil"), consulta.Plan);
        Assert.Equal(new VehiculoPublico("AB123CD", "Toyota", "Corolla XEi", 2021), consulta.Vehiculo);
        Assert.Equal(6, consulta.Cuotas.Count);
        Assert.Equal([1, 2, 3, 4, 5, 6], consulta.Cuotas.Select(c => c.Numero));
        var primera = consulta.Cuotas[0];
        Assert.Equal("PAGADA", primera.Estado);
        Assert.Equal(0m, primera.Recargo);
        Assert.Equal(primera.Importe, primera.Total);
        Assert.Equal(new DateOnly(2026, 11, 10), primera.Vencimiento);
        Assert.Equal("PENDIENTE", consulta.Cuotas[1].Estado);
    }

    [Fact]
    public async Task Post_ForeignDni_Returns404WithSameMessageAsUnknownPolicy()
    {
        Poliza ajena;
        await using (var contexto = _sqlite.CreateContext())
        {
            ajena = await PolizasDePrueba.AgregarPolizaAsync(
                contexto, EstadoPoliza.Vigente, new DateTime(2026, 10, 15, 0, 0, 0, DateTimeKind.Utc));
        }
        var cliente = CreateClientFromIp();

        var deOtro = await cliente.PostAsJsonAsync(Ruta, Body(numero: ajena.Numero));
        var inexistente = await cliente.PostAsJsonAsync(Ruta, Body(numero: "POL-9999999"));

        Assert.Equal(HttpStatusCode.NotFound, deOtro.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, inexistente.StatusCode);
        var problemaDeOtro = await deOtro.Content.ReadFromJsonAsync<ProblemDetails>(Json);
        var problemaInexistente = await inexistente.Content.ReadFromJsonAsync<ProblemDetails>(Json);
        Assert.Equal(VerificadorPublico.MensajeNoEncontrado, problemaDeOtro?.Detail);
        Assert.Equal(problemaDeOtro?.Detail, problemaInexistente?.Detail);
    }

    [Theory]
    [InlineData("1234", "POL-0000001", "Dni")]
    [InlineData("3012345a", "POL-0000001", "Dni")]
    [InlineData("30123456", "POL-1", "NumeroPoliza")]
    [InlineData("30123456", "0000001", "NumeroPoliza")]
    public async Task Post_InvalidFormat_Returns400NamingTheField(string dni, string numero, string campo)
    {
        var respuesta = await CreateClientFromIp().PostAsJsonAsync(Ruta, Body(dni, numero));

        Assert.Equal(HttpStatusCode.BadRequest, respuesta.StatusCode);
        Assert.Equal("application/problem+json", respuesta.Content.Headers.ContentType?.MediaType);
        var problema = await respuesta.Content.ReadFromJsonAsync<ValidationProblemDetails>(Json);
        Assert.NotNull(problema);
        Assert.True(problema.Errors.ContainsKey(campo));
    }

    [Theory]
    [InlineData(EstadoPoliza.Pendiente, "PENDIENTE")]
    [InlineData(EstadoPoliza.Suspendida, "SUSPENDIDA")]
    public async Task Post_NonVigentePolicy_Returns200WithCoberturaFalse(EstadoPoliza estado, string estadoEsperado)
    {
        await ChangeSeededPolicyStateAsync(estado);

        var respuesta = await CreateClientFromIp().PostAsJsonAsync(Ruta, Body());

        Assert.Equal(HttpStatusCode.OK, respuesta.StatusCode);
        var consulta = await respuesta.Content.ReadFromJsonAsync<ConsultaPublicaResponse>(Json);
        Assert.NotNull(consulta);
        Assert.False(consulta.CoberturaVigente);
        Assert.Equal(estadoEsperado, consulta.Estado);
    }

    [Fact]
    public async Task Post_Response_HasNoInternalIdsOrEntities()
    {
        var respuesta = await CreateClientFromIp().PostAsJsonAsync(Ruta, Body());

        var texto = await respuesta.Content.ReadAsStringAsync();
        Assert.DoesNotContain(SeedData.ClienteId.ToString(), texto);
        Assert.DoesNotContain(SeedData.PolizaId.ToString(), texto);
        Assert.DoesNotContain(SeedData.VehiculoId.ToString(), texto);
        Assert.DoesNotContain(SeedData.PlanRcId.ToString(), texto);
        Assert.DoesNotContain(SeedData.CuotaId(1).ToString(), texto);

        using var documento = JsonDocument.Parse(texto);
        var raiz = documento.RootElement;
        Assert.Equal(
            ["numeroPoliza", "estado", "coberturaVigente", "vigenteDesde", "vigenteHasta", "plan", "vehiculo", "cuotas"],
            raiz.EnumerateObject().Select(p => p.Name).ToArray());
        Assert.Equal(
            ["numero", "importe", "recargo", "total", "vencimiento", "estado"],
            raiz.GetProperty("cuotas")[0].EnumerateObject().Select(p => p.Name).ToArray());
    }

    [Fact]
    public async Task Post_EleventhAttemptWithinAMinute_Returns429()
    {
        var cliente = CreateClientFromIp();

        for (var intento = 1; intento <= 10; intento++)
            Assert.Equal(HttpStatusCode.OK, (await cliente.PostAsJsonAsync(Ruta, Body())).StatusCode);

        var rechazado = await cliente.PostAsJsonAsync(Ruta, Body());

        Assert.Equal(HttpStatusCode.TooManyRequests, rechazado.StatusCode);
        Assert.Equal("application/problem+json", rechazado.Content.Headers.ContentType?.MediaType);
    }
}
