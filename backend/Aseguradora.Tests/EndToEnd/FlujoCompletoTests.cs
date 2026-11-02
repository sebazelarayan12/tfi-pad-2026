using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Aseguradora.Application.Security;
using Aseguradora.Data.Seed;
using Aseguradora.Domain.Enums;
using Aseguradora.Tests.Fixtures;
using Aseguradora.Tests.Support;

namespace Aseguradora.Tests.EndToEnd;

/// <summary>
/// US-T-04: the whole back end, with every integration in mock mode, walks the flow of section 8
/// of the spec through HTTP: client, vehicle, quote, policy, online payment, gateway webhook,
/// invoice and valid-insurance query (CU04, CU06, CU09, CU10, CU15, CU16, CU18, CU19).
/// </summary>
/// <remarks>
/// Each test owns its SQL Server container instead of joining <see cref="SqlServerCollection"/>:
/// the flow registers DNI 30123456 (the only adult person in the Renaper mock), so the seeded client
/// has to be moved away, and no other test of the shared container may see that change.
/// Needs <c>ASEGURADORA_TESTS_DOCKER=1</c>; otherwise every test skips.
/// </remarks>
public sealed class FlujoCompletoTests : IAsyncLifetime
{
    private const string DniCliente = "30123456";
    // The seeded vehicle AB123CD already has a Vigente policy; this one belongs to the same DNI in
    // the DNRPA mock and is free in the seed.
    private const string PatenteNueva = "AE789FG";
    private const string Proveedor = "pasarela1";

    private SqlServerContainerFixture? _contenedor;
    private AseguradoraWebFactory? _factory;

    public async Task InitializeAsync()
    {
        if (!SqlServerContainerFixture.DockerHabilitado)
            return;

        _contenedor = new SqlServerContainerFixture();
        await _contenedor.InitializeAsync();
    }

    public async Task DisposeAsync()
    {
        _factory?.Dispose();
        if (_contenedor is not null)
            await _contenedor.DisposeAsync();
    }

    private AseguradoraWebFactory CrearFactory()
    {
        Skip.IfNot(SqlServerContainerFixture.DockerHabilitado, SqlServerContainerFixture.MotivoOmision);
        Skip.IfNot(_contenedor?.Disponible == true, SqlServerContainerFixture.MotivoOmision);

        _factory = new AseguradoraWebFactory();
        // The mock gateway keeps the payment PENDIENTE, so the webhook cannot be confirmed against it.
        _factory.Ajustes[$"Integraciones:Pasarelas:{Proveedor}:ConfirmarWebhook"] = "false";
        _factory.UsarBase(_contenedor!);
        return _factory;
    }

    private async Task LiberarClienteDeSeedAsync()
    {
        await using var contexto = _contenedor!.CrearContexto();
        await ClienteDeSeed.LiberarAsync(contexto);
    }

    private static async Task<JsonElement> LeerAsync(HttpResponseMessage respuesta, HttpStatusCode esperado)
    {
        var cuerpo = await respuesta.Content.ReadAsStringAsync();
        Assert.True(esperado == respuesta.StatusCode,
            $"Expected {(int)esperado} but got {(int)respuesta.StatusCode}: {cuerpo}");
        return cuerpo.Length == 0 ? default : JsonDocument.Parse(cuerpo).RootElement.Clone();
    }

    private static object AltaCliente() => new
    {
        dni = DniCliente,
        email = "flujo.completo@example.com",
        telefono = "3815551234",
        nombre = "Nombre manual",
        apellido = "Apellido manual",
        cuil = "20301234565",
        fechaNacimiento = "1985-03-21",
        sexo = "M",
        calle = "Calle manual",
        numero = "1",
        localidad = "Localidad manual",
        provincia = "Provincia manual",
        codigoPostal = "4000"
    };

    private sealed record PolizaEmitida(Guid Id, string Numero, Guid CuotaId, decimal ImporteCuota);

    /// <summary>Steps 1 to 5: client, vehicle, quote and policy. Returns the policy and its first quota.</summary>
    private static async Task<PolizaEmitida> EmitirPolizaAsync(HttpClient empleado)
    {
        var cliente = await LeerAsync(
            await empleado.PostAsJsonAsync("/api/clientes", AltaCliente()), HttpStatusCode.Created);
        Assert.True(cliente.GetProperty("validadoRenaper").GetBoolean());
        var clienteId = cliente.GetProperty("id").GetGuid();

        var vehiculo = await LeerAsync(
            await empleado.PostAsJsonAsync("/api/vehiculos", new { clienteId, patente = PatenteNueva, uso = 0 }),
            HttpStatusCode.Created);
        Assert.True(vehiculo.GetProperty("validadoDnrpa").GetBoolean());
        var vehiculoId = vehiculo.GetProperty("id").GetGuid();

        var cotizacion = await LeerAsync(
            await empleado.PostAsJsonAsync("/api/cotizaciones", new { vehiculoId }), HttpStatusCode.Created);
        var opcion = cotizacion.GetProperty("opciones").EnumerateArray().First();
        var cotizacionId = opcion.GetProperty("idCotizacion").GetGuid();

        var poliza = await LeerAsync(
            await empleado.PostAsJsonAsync("/api/polizas", new { cotizacionId, vigenciaMeses = 6 }),
            HttpStatusCode.Created);
        var polizaId = poliza.GetProperty("id").GetGuid();
        var numero = poliza.GetProperty("numero").GetString()!;

        var cuotas = await LeerAsync(
            await empleado.GetAsync($"/api/polizas/{polizaId}/cuotas"), HttpStatusCode.OK);
        Assert.Equal(6, cuotas.GetArrayLength());
        var primera = cuotas.EnumerateArray().First();

        return new PolizaEmitida(
            polizaId,
            numero,
            primera.GetProperty("id").GetGuid(),
            primera.GetProperty("importe").GetDecimal() + primera.GetProperty("recargo").GetDecimal());
    }

    private sealed record PagoIniciado(string NumeroPago, string IdPagoPasarela);

    /// <summary>Step 6: the client starts the online payment of the first quota.</summary>
    private static async Task<PagoIniciado> IniciarPagoAsync(HttpClient anonimo, PolizaEmitida poliza)
    {
        var pago = await LeerAsync(
            await anonimo.PostAsJsonAsync("/api/publico/pagos", new
            {
                dni = DniCliente,
                numeroPoliza = poliza.Numero,
                cuotaIds = new[] { poliza.CuotaId },
                proveedor = Proveedor
            }),
            HttpStatusCode.Created);

        // The mock gateway builds its checkout link as ".../checkout/<idPago>".
        var urlPago = pago.GetProperty("urlPago").GetString()!;
        var idPasarela = Uri.UnescapeDataString(urlPago[(urlPago.LastIndexOf('/') + 1)..]);
        return new PagoIniciado(pago.GetProperty("numeroPago").GetString()!, idPasarela);
    }

    /// <summary>Step 7: the gateway tells the API that the payment was approved.</summary>
    private static async Task<HttpResponseMessage> EnviarWebhookAprobadoAsync(
        AseguradoraWebFactory factory, PolizaEmitida poliza, PagoIniciado pago)
    {
        using var pasarela = factory.CreateClient();
        pasarela.DefaultRequestHeaders.Add(TokenDePrueba.ApiKeyHeader, TokenDePrueba.ApiKeyValida(Proveedor));
        return await pasarela.PostAsJsonAsync($"/api/webhooks/pasarela/{Proveedor}", new
        {
            idPago = pago.IdPagoPasarela,
            estado = "APROBADO",
            importe = poliza.ImporteCuota,
            fecha = DateTimeOffset.UtcNow,
            idCuotas = new[] { poliza.CuotaId }
        });
    }

    private static HttpClient ClienteExterno(AseguradoraWebFactory factory)
    {
        var cliente = factory.CreateClient();
        cliente.DefaultRequestHeaders.Add(TokenDePrueba.ApiKeyHeader, TokenDePrueba.ApiKeyValida(Proveedor));
        return cliente;
    }

    [SkippableFact]
    public async Task Flujo_AltaEmisionPagoWebhookFacturaSeguroVigente()
    {
        var factory = CrearFactory();
        await LiberarClienteDeSeedAsync();
        using var empleado = factory.CrearCliente(Roles.Empleado);
        using var anonimo = factory.CreateClient();
        using var externo = ClienteExterno(factory);

        var poliza = await EmitirPolizaAsync(empleado);

        // Before the first payment the policy does not cover the vehicle (RN10).
        var antes = await LeerAsync(
            await externo.GetAsync($"/api/externo/vehiculos/{PatenteNueva}/seguro-vigente"), HttpStatusCode.OK);
        Assert.False(antes.GetProperty("tieneSeguro").GetBoolean());

        var pago = await IniciarPagoAsync(anonimo, poliza);
        var webhook = await EnviarWebhookAprobadoAsync(factory, poliza, pago);
        await LeerAsync(webhook, HttpStatusCode.OK);

        var detalle = await LeerAsync(
            await empleado.GetAsync($"/api/polizas/{poliza.Id}"), HttpStatusCode.OK);
        Assert.Equal((int)EstadoPoliza.Vigente, detalle.GetProperty("estado").GetInt32());

        var factura = await LeerAsync(
            await anonimo.PostAsJsonAsync("/api/publico/factura", new { dni = DniCliente, numeroPago = pago.NumeroPago }),
            HttpStatusCode.OK);
        Assert.False(string.IsNullOrWhiteSpace(factura.GetProperty("cae").GetString()));

        var seguro = await LeerAsync(
            await externo.GetAsync($"/api/externo/vehiculos/{PatenteNueva}/seguro-vigente"), HttpStatusCode.OK);
        Assert.True(seguro.GetProperty("tieneSeguro").GetBoolean());
        Assert.Equal(poliza.Numero, seguro.GetProperty("numeroPoliza").GetString());
        Assert.Equal(
            detalle.GetProperty("fechaFin").GetString(),
            seguro.GetProperty("vigenteHasta").GetString());
    }

    [SkippableFact]
    public async Task WebhookRepetido_NoDuplicaPagoNiFactura()
    {
        var factory = CrearFactory();
        await LiberarClienteDeSeedAsync();
        using var empleado = factory.CrearCliente(Roles.Empleado);
        using var anonimo = factory.CreateClient();

        var poliza = await EmitirPolizaAsync(empleado);
        var pago = await IniciarPagoAsync(anonimo, poliza);

        await LeerAsync(await EnviarWebhookAprobadoAsync(factory, poliza, pago), HttpStatusCode.OK);
        await LeerAsync(await EnviarWebhookAprobadoAsync(factory, poliza, pago), HttpStatusCode.OK);

        await using var contexto = _contenedor!.CrearContexto();
        var pagos = contexto.PagoCuotas.Count(pc => pc.CuotaId == poliza.CuotaId);
        var facturas = contexto.Facturas.Count(f => f.Pago.PagoCuotas.Any(pc => pc.CuotaId == poliza.CuotaId));
        Assert.Equal(1, pagos);
        Assert.Equal(1, facturas);
    }

    [SkippableFact]
    public async Task SeguroVigente_PolizaNoVigente_RespondeTieneSeguroFalse()
    {
        var factory = CrearFactory();
        using var empleado = factory.CrearCliente(Roles.Empleado);
        using var externo = ClienteExterno(factory);

        var antes = await LeerAsync(
            await externo.GetAsync("/api/externo/vehiculos/AB123CD/seguro-vigente"), HttpStatusCode.OK);
        Assert.True(antes.GetProperty("tieneSeguro").GetBoolean());

        await LeerAsync(
            await empleado.PostAsJsonAsync($"/api/polizas/{SeedData.PolizaId}/cancelar", new { motivo = "Baja pedida por el cliente" }),
            HttpStatusCode.OK);

        var despues = await LeerAsync(
            await externo.GetAsync("/api/externo/vehiculos/AB123CD/seguro-vigente"), HttpStatusCode.OK);
        Assert.False(despues.GetProperty("tieneSeguro").GetBoolean());
    }
}
