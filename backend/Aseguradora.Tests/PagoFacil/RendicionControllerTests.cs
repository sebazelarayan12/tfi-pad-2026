using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Aseguradora.Application.Dtos.PagoFacil;
using Aseguradora.Application.PagoFacil;
using Aseguradora.Application.Security;
using Aseguradora.Data;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Tests.Data;
using Aseguradora.Tests.Fixtures;
using Aseguradora.Tests.Support;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Aseguradora.Tests.PagoFacil;

/// <summary>
/// HTTP tests of the settlement file with the real F4 approval (US-F4-02) and the ARCA mock, so they
/// also cover RendicionIntegracionTests: installment Pagada, policy activated and invoice issued.
/// </summary>
public sealed class RendicionControllerTests : IDisposable
{
    private const string RutaRendiciones = "/api/pagofacil/rendiciones";
    private const string ProblemJson = "application/problem+json";
    private const decimal ImporteCuota = 12000m;

    private readonly SqliteDbFixture _sqlite = new();

    public void Dispose() => _sqlite.Dispose();

    private AseguradoraWebFactory CrearFactory(bool usarAutenticacionReal = false)
    {
        var factory = new AseguradoraWebFactory
        {
            UsarAutenticacionReal = usarAutenticacionReal,
            ConfigurarServicios = (_, services) =>
            {
                services.RemoveAll<DbContextOptions<AseguradoraDbContext>>();
                services.RemoveAll<AseguradoraDbContext>();
                services.AddScoped<AseguradoraDbContext>(_ => _sqlite.CreateContext());
            }
        };
        factory.Ajustes[$"{PagoFacilOpciones.Seccion}:{nameof(PagoFacilOpciones.CodigoEmpresa)}"] =
            RendicionesDePrueba.CodigoEmpresa.ToString(System.Globalization.CultureInfo.InvariantCulture);
        return factory;
    }

    private static MultipartFormDataContent Formulario(string nombre, Stream archivo)
    {
        var contenido = new StreamContent(archivo);
        contenido.Headers.ContentType = new MediaTypeHeaderValue("text/plain");
        return new MultipartFormDataContent { { contenido, "archivo", nombre } };
    }

    private static MultipartFormDataContent Formulario(string nombre, params string[] lineas) =>
        Formulario(nombre, RendicionesDePrueba.Archivo(lineas));

    /// <summary>A Pendiente policy whose installment 1 is still unpaid.</summary>
    private async Task<Poliza> AgregarPolizaPendienteAsync()
    {
        await using var context = _sqlite.CreateContext();
        return await PolizasDePrueba.AgregarPolizaAsync(context, EstadoPoliza.Pendiente, PolizasDePrueba.Ahora.UtcDateTime);
    }

    private static string LineaDe(Poliza poliza, int cuota) =>
        RendicionesDePrueba.LineaDeCuota(RendicionesDePrueba.NumeroEnCodigo(poliza.Numero), cuota, ImporteCuota);

    [Fact]
    public async Task Post_201()
    {
        var poliza = await AgregarPolizaPendienteAsync();
        await using var factory = CrearFactory();

        var response = await factory.CrearCliente(Roles.Empleado).PostAsync(RutaRendiciones,
            Formulario("rendicion-1.txt", LineaDe(poliza, 1), LineaDe(poliza, 99), LineaDe(poliza, 2)));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var resultado = await response.Content.ReadFromJsonAsync<RendicionResponse>();
        Assert.NotNull(resultado);
        Assert.Equal(2, resultado.Procesadas);
        Assert.Equal(2, Assert.Single(resultado.Errores).Linea);
    }

    [Fact]
    public async Task ActivaPolizaCuota1()
    {
        var poliza = await AgregarPolizaPendienteAsync();
        await using var factory = CrearFactory();

        var response = await factory.CrearCliente(Roles.Empleado).PostAsync(RutaRendiciones,
            Formulario("rendicion-activa.txt", LineaDe(poliza, 1)));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        await using var context = _sqlite.CreateContext();
        var guardada = await context.Polizas.Include(p => p.Cuotas).SingleAsync(p => p.Id == poliza.Id);
        Assert.Equal(EstadoPoliza.Vigente, guardada.Estado);
        Assert.Equal(EstadoCuota.Pagada, guardada.Cuotas.Single(c => c.Numero == 1).Estado);
        Assert.All(guardada.Cuotas.Where(c => c.Numero > 1), c => Assert.Equal(EstadoCuota.Pendiente, c.Estado));
    }

    [Fact]
    public async Task FacturaCadaPagoDePagoFacil()
    {
        var poliza = await AgregarPolizaPendienteAsync();
        await using var factory = CrearFactory();

        var response = await factory.CrearCliente(Roles.Empleado).PostAsync(RutaRendiciones,
            Formulario("rendicion-factura.txt", LineaDe(poliza, 1), LineaDe(poliza, 2)));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        await using var context = _sqlite.CreateContext();
        var pagos = await context.Pagos.Include(p => p.Factura)
            .Where(p => p.Medio == MedioPago.PagoFacil).ToListAsync();
        Assert.Equal(2, pagos.Count);
        Assert.All(pagos, p =>
        {
            Assert.Equal(EstadoPago.Aprobado, p.Estado);
            Assert.NotNull(p.Factura);
            Assert.Equal(ImporteCuota, p.Factura.Importe);
            Assert.True(p.Factura.Estado is EstadoFactura.Autorizada or EstadoFactura.PendienteCae);
            if (p.Factura.Estado == EstadoFactura.Autorizada)
                Assert.False(string.IsNullOrEmpty(p.Factura.Cae));
        });
    }

    [Fact]
    public async Task CuotaRepetidaEnElMismoArchivo_CobraUnaVezYReportaLaSegunda()
    {
        var poliza = await AgregarPolizaPendienteAsync();
        await using var factory = CrearFactory();

        var response = await factory.CrearCliente(Roles.Empleado).PostAsync(RutaRendiciones,
            Formulario("rendicion-duplicada.txt", LineaDe(poliza, 1), LineaDe(poliza, 1)));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var resultado = await response.Content.ReadFromJsonAsync<RendicionResponse>();
        Assert.NotNull(resultado);
        Assert.Equal(1, resultado.Procesadas);
        var error = Assert.Single(resultado.Errores);
        Assert.Equal(2, error.Linea);
        Assert.Contains("Pagada", error.Motivo, StringComparison.Ordinal);

        await using var context = _sqlite.CreateContext();
        var pagos = await context.Pagos.Where(p => p.Medio == MedioPago.PagoFacil).ToListAsync();
        Assert.Equal(EstadoPago.Aprobado, Assert.Single(pagos).Estado);
        Assert.Single(await context.Facturas.ToListAsync());
    }

    [Fact]
    public async Task Post_Repetido_400()
    {
        var poliza = await AgregarPolizaPendienteAsync();
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);
        await empleado.PostAsync(RutaRendiciones, Formulario("repetido.txt", LineaDe(poliza, 1)));

        var response = await empleado.PostAsync(RutaRendiciones, Formulario("repetido.txt", LineaDe(poliza, 2)));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(ProblemJson, response.Content.Headers.ContentType?.MediaType);
        await using var context = _sqlite.CreateContext();
        Assert.Equal(1, await context.Pagos.CountAsync(p => p.Medio == MedioPago.PagoFacil));
    }

    [Fact]
    public async Task Post_LineaMalFormada_400ConElDetalle()
    {
        await using var factory = CrearFactory();

        var response = await factory.CrearCliente(Roles.Empleado).PostAsync(RutaRendiciones,
            Formulario("mal.txt", "123"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Contains("línea 1", await response.Content.ReadAsStringAsync(), StringComparison.Ordinal);
    }

    [Fact]
    public async Task Post_ArchivoVacio_400()
    {
        await using var factory = CrearFactory();

        var response = await factory.CrearCliente(Roles.Empleado).PostAsync(RutaRendiciones,
            Formulario("vacio.txt", new MemoryStream()));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Post_ArchivoMayorA5MB_400()
    {
        await using var factory = CrearFactory();

        var response = await factory.CrearCliente(Roles.Empleado).PostAsync(RutaRendiciones,
            Formulario("grande.txt", new MemoryStream(new byte[RendicionService.TamanoMaximoBytes + 1])));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Contains("5 MB", await response.Content.ReadAsStringAsync(), StringComparison.Ordinal);
    }

    [Fact]
    public async Task Post_SinArchivo_400()
    {
        await using var factory = CrearFactory();

        var response = await factory.CrearCliente(Roles.Empleado).PostAsync(RutaRendiciones, new MultipartFormDataContent());

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Post_SinToken_401()
    {
        await using var factory = CrearFactory(usarAutenticacionReal: true);

        var response = await factory.CreateClient().PostAsync(RutaRendiciones, Formulario("x.txt", "1"));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Theory]
    [InlineData("POST")]
    [InlineData("GET")]
    public async Task RolNoAutorizado_403(string metodo)
    {
        await using var factory = CrearFactory(usarAutenticacionReal: true);
        var cliente = factory.CreateClient();
        cliente.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", TokenDePrueba.Token(rol: "Cliente"));

        var response = metodo == "POST"
            ? await cliente.PostAsync(RutaRendiciones, Formulario("x.txt", "1"))
            : await cliente.GetAsync(RutaRendiciones);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Get_SinToken_401()
    {
        await using var factory = CrearFactory(usarAutenticacionReal: true);

        var response = await factory.CreateClient().GetAsync(RutaRendiciones);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Get_HistorialOrdenado()
    {
        var poliza = await AgregarPolizaPendienteAsync();
        await using (var context = _sqlite.CreateContext())
        {
            context.RendicionesPagoFacil.Add(new RendicionPagoFacil
            {
                NombreArchivo = "anterior.txt",
                FechaProceso = DateTime.UtcNow.AddDays(-1)
            });
            await context.SaveChangesAsync();
        }
        await using var factory = CrearFactory();
        var empleado = factory.CrearCliente(Roles.Empleado);
        await empleado.PostAsync(RutaRendiciones, Formulario("ultima.txt", LineaDe(poliza, 1)));

        var historial = await empleado.GetFromJsonAsync<List<HistorialRendicionResponse>>(RutaRendiciones);

        Assert.NotNull(historial);
        Assert.Equal(["ultima.txt", "anterior.txt"], historial.Select(h => h.NombreArchivo));
        Assert.Equal(1, historial[0].PagosAprobados);
        Assert.Equal(ImporteCuota, historial[0].ImporteTotal);
    }
}
