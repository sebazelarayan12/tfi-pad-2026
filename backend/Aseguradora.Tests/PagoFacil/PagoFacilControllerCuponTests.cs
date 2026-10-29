using System.Net;
using System.Net.Http.Json;
using Aseguradora.Application.Dtos.PagoFacil;
using Aseguradora.Application.PagoFacil;
using Aseguradora.Application.Security;
using Aseguradora.Data;
using Aseguradora.Data.Seed;
using Aseguradora.Tests.Data;
using Aseguradora.Tests.Fixtures;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Aseguradora.Tests.PagoFacil;

public sealed class PagoFacilControllerCuponTests : IDisposable
{
    private static readonly string RutaCupon = $"/api/pagofacil/cuotas/{SeedData.CuotaId(2)}/cupon";

    private readonly SqliteDbFixture _sqlite = new();
    private readonly AseguradoraWebFactory _factory;

    public PagoFacilControllerCuponTests()
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
    public async Task Get_Empleado_200()
    {
        var response = await _factory.CrearCliente(Roles.Empleado).GetAsync(RutaCupon);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var cupon = await response.Content.ReadFromJsonAsync<CuponPagoFacilResponse>();
        Assert.NotNull(cupon);
        Assert.Equal("POL-0000001", cupon.NumeroPoliza);
        Assert.True(CodigoBarrasPagoFacil.Validar(cupon.CodigoBarras));
    }

    [Fact]
    public async Task Get_SinToken_401()
    {
        var response = await _factory.CreateClient().GetAsync(RutaCupon);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Get_CuotaPagada_400()
    {
        // Installment 1 of the seed is Pagada.
        var response = await _factory.CrearCliente(Roles.Empleado)
            .GetAsync($"/api/pagofacil/cuotas/{SeedData.CuotaId(1)}/cupon");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Get_CuotaInexistente_404()
    {
        var response = await _factory.CrearCliente(Roles.Empleado)
            .GetAsync($"/api/pagofacil/cuotas/{Guid.NewGuid()}/cupon");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
