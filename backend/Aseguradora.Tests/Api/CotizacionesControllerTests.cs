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
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Aseguradora.Tests.Api;

public sealed class CotizacionesControllerTests : IDisposable
{
    private const string RutaCotizaciones = "/api/cotizaciones";

    private static readonly DateTimeOffset Ahora = new(2026, 10, 29, 15, 0, 0, TimeSpan.Zero);

    private readonly SqliteDbFixture _sqlite = new();

    public void Dispose() => _sqlite.Dispose();

    private AseguradoraWebFactory CrearFactory(bool relojFijo = true, bool usarAutenticacionReal = false) =>
        new()
        {
            UsarAutenticacionReal = usarAutenticacionReal,
            ConfigurarServicios = (_, services) =>
            {
                services.RemoveAll<DbContextOptions<AseguradoraDbContext>>();
                services.RemoveAll<AseguradoraDbContext>();
                services.AddScoped<AseguradoraDbContext>(_ => _sqlite.CreateContext());

                if (relojFijo)
                {
                    services.RemoveAll<TimeProvider>();
                    services.AddSingleton<TimeProvider>(new RelojFalso(Ahora));
                }
            }
        };

    [Fact]
    public async Task POST_devuelve_201_con_opciones()
    {
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var response = await empleado.PostAsJsonAsync(
            RutaCotizaciones, new CotizarVehiculoRequest { VehiculoId = SeedData.VehiculoId });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var resultado = await response.Content.ReadFromJsonAsync<CotizacionResultado>();
        Assert.NotNull(resultado);
        var rc = Assert.Single(resultado.Opciones, o => o.CodigoPlan == "RC");
        Assert.Equal(12000.00m, rc.PrimaMensual);
        Assert.Equal(Ahora.UtcDateTime.AddDays(15), resultado.FechaVencimiento);
        await using var context = _sqlite.CreateContext();
        Assert.True(await context.Cotizaciones.AnyAsync(c => c.Id == rc.IdCotizacion));
    }

    [Fact]
    public async Task GET_devuelve_el_dto_de_una_cotizacion_creada()
    {
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);
        var creada = await (await empleado.PostAsJsonAsync(
                RutaCotizaciones, new CotizarVehiculoRequest { VehiculoId = SeedData.VehiculoId }))
            .Content.ReadFromJsonAsync<CotizacionResultado>();
        Assert.NotNull(creada);
        var opcion = creada.Opciones[0];

        var response = await empleado.GetAsync($"{RutaCotizaciones}/{opcion.IdCotizacion}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dto = await response.Content.ReadFromJsonAsync<CotizacionDto>();
        Assert.NotNull(dto);
        Assert.Equal(opcion.IdCotizacion, dto.Id);
        Assert.Equal(opcion.CodigoPlan, dto.CodigoPlan);
        Assert.Equal(OrigenCotizacion.Panel, dto.Origen);
    }

    [Fact]
    public async Task GET_inexistente_devuelve_404()
    {
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var response = await empleado.GetAsync($"{RutaCotizaciones}/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task POST_con_vehiculo_inexistente_devuelve_404()
    {
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var response = await empleado.PostAsJsonAsync(
            RutaCotizaciones, new CotizarVehiculoRequest { VehiculoId = Guid.NewGuid() });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task POST_sin_vehiculoId_devuelve_400()
    {
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var response = await empleado.PostAsJsonAsync(RutaCotizaciones, new { });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task POST_sin_planes_compatibles_devuelve_400()
    {
        await using (var context = _sqlite.CreateContext())
        {
            foreach (var plan in await context.Planes.ToListAsync())
                plan.Activo = false;
            await context.SaveChangesAsync();
        }

        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);

        var response = await empleado.PostAsJsonAsync(
            RutaCotizaciones, new CotizarVehiculoRequest { VehiculoId = SeedData.VehiculoId });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Theory]
    [InlineData("POST")]
    [InlineData("GET")]
    public async Task Sin_token_devuelve_401_y_sin_rol_403(string metodo)
    {
        await using var factory = CrearFactory(relojFijo: false, usarAutenticacionReal: true);
        var anonimo = factory.CreateClient();
        var sinRol = factory.CreateClient();
        sinRol.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", TokenDePrueba.Token(rol: null));

        HttpRequestMessage NuevaSolicitud() => metodo == "POST"
            ? new HttpRequestMessage(HttpMethod.Post, RutaCotizaciones)
            {
                Content = JsonContent.Create(new CotizarVehiculoRequest { VehiculoId = SeedData.VehiculoId })
            }
            : new HttpRequestMessage(HttpMethod.Get, $"{RutaCotizaciones}/{Guid.NewGuid()}");

        var respSinToken = await anonimo.SendAsync(NuevaSolicitud());
        var respSinRol = await sinRol.SendAsync(NuevaSolicitud());

        Assert.Equal(HttpStatusCode.Unauthorized, respSinToken.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, respSinRol.StatusCode);
    }
}
