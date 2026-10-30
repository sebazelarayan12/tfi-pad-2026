using Aseguradora.Application.Dtos;
using Aseguradora.Application.Exceptions;
using Aseguradora.Data;
using Aseguradora.Data.Seed;
using Aseguradora.Domain.Enums;
using Aseguradora.Tests.Data;
using Aseguradora.Tests.Support;
using Microsoft.EntityFrameworkCore;

namespace Aseguradora.Tests.Pagos;

public sealed class PagoServiceCajaTests : IDisposable
{
    private readonly SqliteDbFixture _fixture = new();
    private readonly AseguradoraDbContext _db;
    public PagoServiceCajaTests() => _db = _fixture.CreateContext();
    public void Dispose() { _db.Dispose(); _fixture.Dispose(); }
    private static PagoCajaRequest Pedido(params int[] numeros) => new() { CuotaIds = numeros.Select(SeedData.CuotaId).ToArray() };

    [Theory]
    [InlineData(1)]
    [InlineData(3)]
    public async Task Registrar_CuotasValidas_ApruebaPagaYFactura(int cantidad)
    {
        var numeros = Enumerable.Range(2, cantidad).ToArray();
        var ids = Pedido(numeros).CuotaIds;
        var seleccion = await _db.Cuotas.Where(c => ids.Contains(c.Id)).ToListAsync();
        seleccion[0].Recargo = 150;
        await _db.SaveChangesAsync();
        var esperado = seleccion.Sum(c => c.Importe + c.Recargo);
        var respuesta = await ServiciosPagoDePrueba.Crear(_db).RegistrarCajaAsync(Pedido(numeros));
        Assert.Equal("APROBADO", respuesta.Estado);
        Assert.Equal("CAJA", respuesta.Medio);
        Assert.Matches("^PAG-[0-9a-fA-F]{6}$", respuesta.Numero);
        Assert.Equal(esperado, respuesta.ImporteTotal);
        Assert.NotNull(respuesta.FechaAcreditacion);
        Assert.Equal("AUTORIZADA", respuesta.Factura?.Estado);
        await using var lectura = _fixture.CreateContext();
        Assert.All(await lectura.Cuotas.Where(c => ids.Contains(c.Id)).ToListAsync(),
            c => Assert.Equal(EstadoCuota.Pagada, c.Estado));
        Assert.Equal(1, await lectura.Facturas.CountAsync(f => f.PagoId == respuesta.Id));
    }

    [Theory]
    [InlineData(EstadoCuota.Anulada)]
    [InlineData(EstadoCuota.Pagada)]
    public async Task Registrar_CuotaNoPagable_NoGuardaPago(EstadoCuota estado)
    {
        (await _db.Cuotas.FindAsync(SeedData.CuotaId(2)))!.Estado = estado;
        await _db.SaveChangesAsync();
        await Assert.ThrowsAsync<BusinessRuleException>(() => ServiciosPagoDePrueba.Crear(_db).RegistrarCajaAsync(Pedido(2)));
        Assert.Equal(1, await _db.Pagos.CountAsync());
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Registrar_ListaVaciaORepetida_NoGuardaPago(bool repetida)
    {
        await Assert.ThrowsAsync<BusinessRuleException>(() => ServiciosPagoDePrueba.Crear(_db)
            .RegistrarCajaAsync(repetida ? Pedido(2, 2) : Pedido()));
        Assert.Equal(1, await _db.Pagos.CountAsync());
    }

    [Fact]
    public async Task Registrar_CuotaInexistente_404SinGuardar()
    {
        await Assert.ThrowsAsync<NotFoundException>(() => ServiciosPagoDePrueba.Crear(_db)
            .RegistrarCajaAsync(new PagoCajaRequest { CuotaIds = [SeedData.CuotaId(2), Guid.NewGuid()] }));
        Assert.Equal(1, await _db.Pagos.CountAsync());
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Registrar_VariasPolizas_ExigeMismoCliente(bool mismoCliente)
    {
        var otra = await PolizasDePrueba.AgregarPolizaAsync(_db, EstadoPoliza.Pendiente, DateTime.UtcNow);
        if (mismoCliente)
        {
            otra.ClienteId = SeedData.ClienteId;
            otra.Cliente = (await _db.Clientes.FindAsync(SeedData.ClienteId))!;
            await _db.SaveChangesAsync();
        }
        var pedido = new PagoCajaRequest { CuotaIds = [SeedData.CuotaId(2), otra.Cuotas.First().Id] };
        var servicio = ServiciosPagoDePrueba.Crear(_db);
        if (mismoCliente)
            Assert.Equal("APROBADO", (await servicio.RegistrarCajaAsync(pedido)).Estado);
        else
        {
            await Assert.ThrowsAsync<BusinessRuleException>(() => servicio.RegistrarCajaAsync(pedido));
            Assert.Equal(1, await _db.Pagos.CountAsync());
        }
    }

    [Fact]
    public async Task Registrar_CuotaVencida_IncluyeRecargo()
    {
        var cuota = (await _db.Cuotas.FindAsync(SeedData.CuotaId(2)))!;
        cuota.Vencer(cuota.FechaVencimiento.AddDays(1));
        await _db.SaveChangesAsync();
        Assert.True(cuota.Recargo > 0);
        var respuesta = await ServiciosPagoDePrueba.Crear(_db).RegistrarCajaAsync(Pedido(2));
        Assert.Equal(cuota.Importe + cuota.Recargo, respuesta.ImporteTotal);
        Assert.Equal(EstadoCuota.Pagada, cuota.Estado);
    }

    [Fact]
    public async Task Registrar_CuotaConCheckoutEnCurso_RechazaSinCobrar()
    {
        var cuota = (await _db.Cuotas.FindAsync(SeedData.CuotaId(2)))!;
        _db.Pagos.Add(Aseguradora.Domain.Entities.Pago.CrearPendiente(SeedData.ClienteId, "PAG-abcdef",
            MedioPago.Pasarela, [cuota], DateTime.UtcNow, "pasarela1"));
        await _db.SaveChangesAsync();
        await Assert.ThrowsAsync<BusinessRuleException>(() => ServiciosPagoDePrueba.Crear(_db).RegistrarCajaAsync(Pedido(2)));
        Assert.Equal(EstadoCuota.Pendiente, cuota.Estado);
        Assert.Equal(2, await _db.Pagos.CountAsync());
    }

    [Fact]
    public async Task Registrar_ArcaNoDisponible_DevuelveFacturaPendienteCae()
    {
        var servicio = ServiciosPagoDePrueba.Crear(_db, fallaArca: true);
        var pago = await servicio.RegistrarCajaAsync(Pedido(2));
        var factura = await servicio.ObtenerFacturaAsync(pago.Id);
        Assert.Equal("APROBADO", pago.Estado);
        Assert.Equal("PENDIENTE_CAE", factura.Estado);
        Assert.Null(factura.Cae);
        Assert.Null(factura.VencimientoCae);
    }

    [Fact]
    public async Task Consultar_RecargaDesdeBase_ConservaFechasUtc()
    {
        var creado = await ServiciosPagoDePrueba.Crear(_db).RegistrarCajaAsync(Pedido(2));
        _db.ChangeTracker.Clear();
        var guardado = (await _db.Pagos.FindAsync(creado.Id))!;
        Assert.Equal(DateTimeKind.Unspecified, guardado.FechaCreacion.Kind);
        var servicio = ServiciosPagoDePrueba.Crear(_db);
        var consultado = await servicio.ObtenerPagoAsync(creado.Id);
        var factura = await servicio.ObtenerFacturaAsync(creado.Id);
        Assert.Equal(DateTimeKind.Utc, consultado.FechaCreacion.Kind);
        Assert.Equal(DateTimeKind.Utc, consultado.FechaAcreditacion!.Value.Kind);
        Assert.Equal(DateTimeKind.Utc, factura.FechaEmision.Kind);
        Assert.Equal(creado.FechaCreacion, consultado.FechaCreacion);
        Assert.Equal(creado.FechaAcreditacion, consultado.FechaAcreditacion);
        Assert.Equal(creado.Factura!.FechaEmision, factura.FechaEmision);
        var publica = await servicio.ObtenerFacturaPublicaAsync(new PublicoFacturaRequest
        {
            Dni = "30123456", NumeroPago = creado.Numero
        });
        Assert.Equal(DateTimeKind.Utc, publica.FechaEmision.Kind);
        Assert.Equal(factura, publica);
    }

    [Fact]
    public async Task Consultar_Inexistentes_404()
    {
        var servicio = ServiciosPagoDePrueba.Crear(_db);
        await Assert.ThrowsAsync<NotFoundException>(() => servicio.ObtenerPagoAsync(Guid.NewGuid()));
        await Assert.ThrowsAsync<NotFoundException>(() => servicio.ObtenerFacturaAsync(Guid.NewGuid()));
    }
}
