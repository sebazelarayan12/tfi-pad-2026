using Aseguradora.Application.Dtos;
using Aseguradora.Application.Exceptions;
using Aseguradora.Application.Publico;
using Aseguradora.Data;
using Aseguradora.Data.Seed;
using Aseguradora.Domain.Entities;
using Aseguradora.Tests.Data;

namespace Aseguradora.Tests.Pagos;

public sealed class PagoServiceFacturaPublicaTests : IDisposable
{
    private readonly SqliteDbFixture _fixture = new();
    private readonly AseguradoraDbContext _db;
    public PagoServiceFacturaPublicaTests()
    {
        _db = _fixture.CreateContext();
        ServiciosPagoDePrueba.AgregarFacturaSeed(_db);
    }
    public void Dispose() { _db.Dispose(); _fixture.Dispose(); }

    [Fact]
    public async Task Consultar_DatosCorrectos_UsaVerificadorYDevuelveFactura()
    {
        var verificador = new VerificadorFake((await _db.Pagos.FindAsync(SeedData.PagoId))!);
        var factura = await ServiciosPagoDePrueba.Crear(_db, verificador).ObtenerFacturaPublicaAsync(
            new PublicoFacturaRequest { Dni = "30123456", NumeroPago = "PAG-000001" });
        Assert.Equal(1, verificador.Llamadas);
        Assert.Equal(SeedData.PagoId, factura.PagoId);
        Assert.Equal("AUTORIZADA", factura.Estado);
    }

    [Fact]
    public async Task Consultar_VerificadorReal_ValidaTitularYErrorGenerico()
    {
        var servicio = ServiciosPagoDePrueba.Crear(_db);
        var factura = await servicio.ObtenerFacturaPublicaAsync(new PublicoFacturaRequest
        {
            Dni = "30123456", NumeroPago = "PAG-000001"
        });
        Assert.Equal(SeedData.PagoId, factura.PagoId);
        var dni = await Assert.ThrowsAsync<NotFoundException>(() => servicio.ObtenerFacturaPublicaAsync(
            new PublicoFacturaRequest { Dni = "99999999", NumeroPago = "PAG-000001" }));
        var numero = await Assert.ThrowsAsync<NotFoundException>(() => servicio.ObtenerFacturaPublicaAsync(
            new PublicoFacturaRequest { Dni = "30123456", NumeroPago = "PAG-ffffff" }));
        Assert.Equal(VerificadorPublico.MensajeNoEncontrado, dni.Message);
        Assert.Equal(dni.Message, numero.Message);
    }

    [Fact]
    public async Task Consultar_DniONumeroIncorrectos_PropagaMismoErrorGenerico()
    {
        var verificador = new VerificadorFake((await _db.Pagos.FindAsync(SeedData.PagoId))!);
        var servicio = ServiciosPagoDePrueba.Crear(_db, verificador);
        var dni = await Assert.ThrowsAsync<NotFoundException>(() => servicio.ObtenerFacturaPublicaAsync(
            new PublicoFacturaRequest { Dni = "99999999", NumeroPago = "PAG-000001" }));
        var numero = await Assert.ThrowsAsync<NotFoundException>(() => servicio.ObtenerFacturaPublicaAsync(
            new PublicoFacturaRequest { Dni = "30123456", NumeroPago = "PAG-ffffff" }));
        Assert.Equal(dni.Message, numero.Message);
        Assert.Equal(VerificadorPublico.MensajeNoEncontrado, dni.Message);
        Assert.Equal(2, verificador.Llamadas);
    }

    private sealed class VerificadorFake(Pago pago) : IVerificadorPublico
    {
        public int Llamadas { get; private set; }
        public Task<Pago> VerificarPagoAsync(string dni, string numeroPago, CancellationToken ct = default)
        {
            Llamadas++;
            if (dni != "30123456" || numeroPago != "PAG-000001")
                throw new NotFoundException(VerificadorPublico.MensajeNoEncontrado);
            return Task.FromResult(pago);
        }
        public Task<Poliza> VerificarPolizaAsync(string dni, string numeroPoliza, CancellationToken ct = default) =>
            throw new NotSupportedException();
    }
}
