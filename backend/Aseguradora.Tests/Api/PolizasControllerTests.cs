using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Aseguradora.Application.Comun;
using Aseguradora.Application.Dtos.Polizas;
using Aseguradora.Application.Security;
using Aseguradora.Application.Services;
using Aseguradora.Data;
using Aseguradora.Data.Seed;
using Aseguradora.Domain.Enums;
using Aseguradora.Tests.Data;
using Aseguradora.Tests.Fakes;
using Aseguradora.Tests.Fixtures;
using Aseguradora.Tests.Support;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Aseguradora.Tests.Api;

public sealed class PolizasControllerTests : IDisposable
{
    private const string RutaPolizas = "/api/polizas";
    private const string ProblemJson = "application/problem+json";

    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    private readonly SqliteDbFixture _sqlite = new();

    public void Dispose() => _sqlite.Dispose();

    private AseguradoraWebFactory CrearFactory(bool usarAutenticacionReal = false) => new()
    {
        UsarAutenticacionReal = usarAutenticacionReal,
        ConfigurarServicios = (_, services) =>
        {
            services.RemoveAll<DbContextOptions<AseguradoraDbContext>>();
            services.RemoveAll<AseguradoraDbContext>();
            services.AddScoped<AseguradoraDbContext>(_ => _sqlite.CreateContext());

            services.RemoveAll<TimeProvider>();
            services.AddSingleton<TimeProvider>(new RelojFalso(PolizasDePrueba.Ahora));
            // The real numbering uses a SQL Server sequence; the seeded policy already is POL-0000001.
            services.RemoveAll<INumeradorPolizas>();
            services.AddScoped<INumeradorPolizas>(_ => new NumeradorPolizasFalso(primero: 2));
        }
    };

    private async Task<Guid> AgregarCotizacionAsync()
    {
        await using var context = _sqlite.CreateContext();
        var cotizacion = await SeedFrente3.AgregarCotizacionDePrueba(context, CancellationToken.None);
        Assert.NotNull(cotizacion);
        return cotizacion.Id;
    }

    [Fact]
    public async Task Post_EmiteYDevuelve201()
    {
        var cotizacionId = await AgregarCotizacionAsync();
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var response = await empleado.PostAsJsonAsync(RutaPolizas, new EmitirPolizaRequest(cotizacionId, 6));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var emitida = await response.Content.ReadFromJsonAsync<PolizaDetalleResponse>(Json);
        Assert.NotNull(emitida);
        Assert.Equal("POL-0000002", emitida.Numero);
        Assert.Equal(EstadoPoliza.Pendiente, emitida.Estado);
        Assert.Equal(cotizacionId, emitida.CotizacionId);
        Assert.Equal(Enumerable.Range(1, 6), emitida.Cuotas.Select(c => c.Numero));
        Assert.NotNull(response.Headers.Location);
        Assert.EndsWith($"{RutaPolizas}/{emitida.Id}", response.Headers.Location.ToString(), StringComparison.OrdinalIgnoreCase);

        await using var context = _sqlite.CreateContext();
        Assert.Equal(6, await context.Cuotas.CountAsync(c => c.PolizaId == emitida.Id));
    }

    [Fact]
    public async Task Post_VigenciaInvalida_400()
    {
        var cotizacionId = await AgregarCotizacionAsync();
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var response = await empleado.PostAsJsonAsync(RutaPolizas, new EmitirPolizaRequest(cotizacionId, 3));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(ProblemJson, response.Content.Headers.ContentType?.MediaType);
        await using var context = _sqlite.CreateContext();
        Assert.False(await context.Polizas.AnyAsync(p => p.CotizacionId == cotizacionId));
    }

    [Fact]
    public async Task Post_RolNoAutorizado_403()
    {
        await using var factory = CrearFactory(usarAutenticacionReal: true);
        var sinRol = factory.CreateClient();
        sinRol.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", TokenDePrueba.Token(rol: "Cliente"));

        var response = await sinRol.PostAsJsonAsync(RutaPolizas, new EmitirPolizaRequest(Guid.NewGuid(), 6));

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Post_SinToken_401()
    {
        await using var factory = CrearFactory(usarAutenticacionReal: true);
        var anonimo = factory.CreateClient();

        var response = await anonimo.PostAsJsonAsync(RutaPolizas, new EmitirPolizaRequest(Guid.NewGuid(), 6));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Theory]
    [InlineData("")]
    [InlineData("?estado=Vigente")]
    [InlineData("/d1000000-0000-0000-0000-000000000001")]
    [InlineData("/d1000000-0000-0000-0000-000000000001/cuotas")]
    public async Task Get_SinToken_401(string ruta)
    {
        await using var factory = CrearFactory(usarAutenticacionReal: true);

        var response = await factory.CreateClient().GetAsync(RutaPolizas + ruta);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Get_FiltraPorEstado()
    {
        await using (var context = _sqlite.CreateContext())
            await PolizasDePrueba.AgregarPolizaAsync(context, EstadoPoliza.Cancelada, PolizasDePrueba.Ahora.UtcDateTime);
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var pagina = await empleado.GetFromJsonAsync<PaginaResponse<PolizaListItemResponse>>(
            $"{RutaPolizas}?estado=Vigente", Json);

        Assert.NotNull(pagina);
        var item = Assert.Single(pagina.Items);
        Assert.Equal(SeedData.PolizaId, item.Id);
        Assert.Equal(EstadoPoliza.Vigente, item.Estado);
        Assert.Equal(1, pagina.Total);
    }

    [Fact]
    public async Task Get_FiltraPorPatente()
    {
        await using (var context = _sqlite.CreateContext())
            await PolizasDePrueba.AgregarPolizaAsync(context, EstadoPoliza.Pendiente, PolizasDePrueba.Ahora.UtcDateTime);
        await using var factory = CrearFactory();
        var administrador = factory.CrearCliente(Roles.Administrador);

        var pagina = await administrador.GetFromJsonAsync<PaginaResponse<PolizaListItemResponse>>(
            $"{RutaPolizas}?patente=AB123CD", Json);

        Assert.NotNull(pagina);
        var item = Assert.Single(pagina.Items);
        Assert.Equal("AB123CD", item.Patente);
        Assert.Equal(SeedData.PolizaId, item.Id);
    }

    [Fact]
    public async Task Get_Paginado_UsaPaginaYTamano()
    {
        await using (var context = _sqlite.CreateContext())
            await PolizasDePrueba.AgregarPolizaAsync(context, EstadoPoliza.Pendiente, PolizasDePrueba.Ahora.UtcDateTime);
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var pagina = await empleado.GetFromJsonAsync<PaginaResponse<PolizaListItemResponse>>(
            $"{RutaPolizas}?pagina=2&tamano=1", Json);

        Assert.NotNull(pagina);
        Assert.Equal(SeedData.PolizaId, Assert.Single(pagina.Items).Id);
        Assert.Equal(2, pagina.Pagina);
        Assert.Equal(1, pagina.TamanoPagina);
        Assert.Equal(2, pagina.Total);
    }

    [Theory]
    [InlineData("?pagina=0")]
    [InlineData("?pagina=21474837")]
    [InlineData("?tamano=0")]
    [InlineData("?tamano=101")]
    [InlineData("?estado=Inexistente")]
    public async Task Get_ParametrosInvalidos_400(string consulta)
    {
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var response = await empleado.GetAsync(RutaPolizas + consulta);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(ProblemJson, response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task Get_Detalle_IncluyeCuotas()
    {
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var poliza = await empleado.GetFromJsonAsync<PolizaDetalleResponse>($"{RutaPolizas}/{SeedData.PolizaId}", Json);

        Assert.NotNull(poliza);
        Assert.Equal(SeedData.VehiculoId, poliza.VehiculoId);
        Assert.Equal("AB123CD", poliza.Patente);
        Assert.Equal("Toyota", poliza.Marca);
        Assert.Equal("Corolla XEi", poliza.Modelo);
        Assert.Equal(SeedData.PlanRcId, poliza.PlanId);
        Assert.Equal("RC", poliza.CodigoPlan);
        Assert.Equal("Responsabilidad Civil", poliza.NombrePlan);
        Assert.Equal(6, poliza.Cuotas.Count);
    }

    [Theory]
    [InlineData("")]
    [InlineData("/cuotas")]
    public async Task Get_IdInexistente_404(string sufijo)
    {
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var response = await empleado.GetAsync($"{RutaPolizas}/{Guid.NewGuid()}{sufijo}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal(ProblemJson, response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task Get_Cuotas_Ordenadas()
    {
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var cuotas = await empleado.GetFromJsonAsync<List<CuotaResponse>>($"{RutaPolizas}/{SeedData.PolizaId}/cuotas", Json);

        Assert.NotNull(cuotas);
        Assert.Equal(Enumerable.Range(1, 6), cuotas.Select(c => c.Numero));
        Assert.Equal(Enumerable.Range(1, 6).Select(SeedData.CuotaId), cuotas.Select(c => c.Id));
    }

    [Fact]
    public async Task Cancelar_Ok_200()
    {
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var response = await empleado.PostAsJsonAsync(
            $"{RutaPolizas}/{SeedData.PolizaId}/cancelar", new CancelarPolizaRequest { Motivo = "Venta del vehículo" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var poliza = await response.Content.ReadFromJsonAsync<PolizaDetalleResponse>(Json);
        Assert.NotNull(poliza);
        Assert.Equal(EstadoPoliza.Cancelada, poliza.Estado);
        Assert.Equal(5, poliza.Cuotas.Count(c => c.Estado == EstadoCuota.Anulada));

        await using var context = _sqlite.CreateContext();
        Assert.Equal(EstadoPoliza.Cancelada, (await context.Polizas.SingleAsync(p => p.Id == SeedData.PolizaId)).Estado);
    }

    [Theory]
    [InlineData("{}")]
    [InlineData("{\"motivo\":\"\"}")]
    [InlineData("{\"motivo\":\"   \"}")]
    public async Task Cancelar_SinMotivo_400(string cuerpo)
    {
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var response = await empleado.PostAsync(
            $"{RutaPolizas}/{SeedData.PolizaId}/cancelar",
            new StringContent(cuerpo, System.Text.Encoding.UTF8, "application/json"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(ProblemJson, response.Content.Headers.ContentType?.MediaType);
        await using var context = _sqlite.CreateContext();
        Assert.Equal(EstadoPoliza.Vigente, (await context.Polizas.SingleAsync(p => p.Id == SeedData.PolizaId)).Estado);
    }

    [Fact]
    public async Task Cancelar_MotivoDeMasDe200_400()
    {
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var response = await empleado.PostAsJsonAsync(
            $"{RutaPolizas}/{SeedData.PolizaId}/cancelar", new CancelarPolizaRequest { Motivo = new string('x', 201) });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Cancelar_MotivoDe200ConEspaciosAlrededor_200()
    {
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);
        var motivo = new string('x', 200);

        var response = await empleado.PostAsJsonAsync(
            $"{RutaPolizas}/{SeedData.PolizaId}/cancelar", new { motivo = $"   {motivo}   " });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        await using var context = _sqlite.CreateContext();
        Assert.Equal(motivo, (await context.Polizas.SingleAsync(p => p.Id == SeedData.PolizaId)).MotivoCancelacion);
    }

    [Fact]
    public async Task Cancelar_PolizaVencida_400()
    {
        Guid polizaId;
        await using (var context = _sqlite.CreateContext())
            polizaId = (await PolizasDePrueba.AgregarPolizaAsync(
                context, EstadoPoliza.Vencida, PolizasDePrueba.Ahora.UtcDateTime)).Id;
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var response = await empleado.PostAsJsonAsync(
            $"{RutaPolizas}/{polizaId}/cancelar", new CancelarPolizaRequest { Motivo = "Pedido del cliente" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(ProblemJson, response.Content.Headers.ContentType?.MediaType);
        await using var verificacion = _sqlite.CreateContext();
        Assert.Equal(EstadoPoliza.Vencida, (await verificacion.Polizas.SingleAsync(p => p.Id == polizaId)).Estado);
    }

    [Fact]
    public async Task Cancelar_PolizaInexistente_404()
    {
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var response = await empleado.PostAsJsonAsync(
            $"{RutaPolizas}/{Guid.NewGuid()}/cancelar", new CancelarPolizaRequest { Motivo = "Pedido del cliente" });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
