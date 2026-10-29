using Aseguradora.Application.Exceptions;
using Aseguradora.Application.Services;
using Aseguradora.Data;
using Aseguradora.Data.Repositories;
using Aseguradora.Data.Seed;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Tests.Data;

namespace Aseguradora.Tests.Externo;

/// <summary>Uses the seed: AB123CD has POL-0000001, Vigente from 2026-10-15 to 2027-04-15, plan RC.</summary>
public sealed class SeguroVigenteServiceTests : IDisposable
{
    internal const string Patente = "AB123CD";
    internal static readonly DateOnly DentroDeLaVigencia = new(2026, 11, 20);
    internal static readonly DateOnly Inicio = new(2026, 10, 15);
    internal static readonly DateOnly Fin = new(2027, 4, 15);

    private readonly SqliteDbFixture _fixture = new();

    public void Dispose() => _fixture.Dispose();

    [Fact]
    public async Task PolizaVigente_TieneSeguro()
    {
        var respuesta = await ConsultarAsync(Patente, DentroDeLaVigencia);

        Assert.True(respuesta.TieneSeguro);
        Assert.Equal(Patente, respuesta.Patente);
        Assert.Equal("POL-0000001", respuesta.NumeroPoliza);
        Assert.Equal("Responsabilidad Civil", respuesta.Plan);
        Assert.Equal(Inicio, respuesta.VigenteDesde);
        Assert.Equal(Fin, respuesta.VigenteHasta);
    }

    [Theory]
    [InlineData(EstadoPoliza.Pendiente)]
    [InlineData(EstadoPoliza.Suspendida)]
    [InlineData(EstadoPoliza.Cancelada)]
    [InlineData(EstadoPoliza.Vencida)]
    public async Task PolizaNoVigente_NoTieneSeguro(EstadoPoliza estado)
    {
        await CambiarPolizaAsync(p => p.Estado = estado);

        var respuesta = await ConsultarAsync(Patente, DentroDeLaVigencia);

        AssertSinSeguro(respuesta);
    }

    [Fact]
    public async Task PatenteInexistente_NoTieneSeguro() =>
        AssertSinSeguro(await ConsultarAsync("ZZ999ZZ", DentroDeLaVigencia), "ZZ999ZZ");

    [Theory]
    [InlineData("AB123")]
    [InlineData("A1B2C3D")]
    [InlineData("")]
    [InlineData("AB-123-CD")]
    public async Task PatenteConFormatoInvalido_Lanza(string patente) =>
        await Assert.ThrowsAsync<BusinessRuleException>(() => ConsultarAsync(patente, DentroDeLaVigencia));

    private static void AssertSinSeguro(Aseguradora.Application.Dtos.Externo.SeguroVigenteResponse respuesta, string patente = Patente)
    {
        Assert.False(respuesta.TieneSeguro);
        Assert.Equal(patente, respuesta.Patente);
        Assert.Null(respuesta.NumeroPoliza);
        Assert.Null(respuesta.Plan);
        Assert.Null(respuesta.VigenteDesde);
        Assert.Null(respuesta.VigenteHasta);
    }

    internal Task<Aseguradora.Application.Dtos.Externo.SeguroVigenteResponse> ConsultarAsync(string patente, DateOnly hoy) =>
        ConsultarAsync(_fixture, patente, hoy);

    internal static async Task<Aseguradora.Application.Dtos.Externo.SeguroVigenteResponse> ConsultarAsync(
        SqliteDbFixture fixture, string patente, DateOnly hoy)
    {
        await using var context = fixture.CreateContext();
        return await CrearServicio(context).ConsultarAsync(patente, hoy);
    }

    private async Task CambiarPolizaAsync(Action<Poliza> cambio)
    {
        await using var context = _fixture.CreateContext();
        var poliza = await context.Polizas.FindAsync(SeedData.PolizaId);
        Assert.NotNull(poliza);
        cambio(poliza);
        await context.SaveChangesAsync();
    }

    private static SeguroVigenteService CrearServicio(AseguradoraDbContext context) =>
        new(new EfRepository<Vehiculo>(context), new EfRepository<Poliza>(context), new EfRepository<Plan>(context));
}

public sealed class SeguroVigenteServiceTests_Vigencia : IDisposable
{
    private readonly SqliteDbFixture _fixture = new();

    public void Dispose() => _fixture.Dispose();

    [Theory]
    [InlineData(2026, 10, 14, false)]
    [InlineData(2026, 10, 15, true)]
    [InlineData(2027, 4, 15, true)]
    [InlineData(2027, 4, 16, false)]
    public async Task FueraDeLasFechas_NoTieneSeguro(int anio, int mes, int dia, bool esperado)
    {
        var respuesta = await SeguroVigenteServiceTests.ConsultarAsync(
            _fixture, SeguroVigenteServiceTests.Patente, new DateOnly(anio, mes, dia));

        Assert.Equal(esperado, respuesta.TieneSeguro);
    }
}

public sealed class SeguroVigenteServiceTests_Normalizacion : IDisposable
{
    private readonly SqliteDbFixture _fixture = new();

    public void Dispose() => _fixture.Dispose();

    [Theory]
    [InlineData("ab123cd")]
    [InlineData(" Ab123Cd ")]
    [InlineData("ab 123 cd")]
    public async Task PatenteSinNormalizar_SeEncuentra(string patente)
    {
        var respuesta = await SeguroVigenteServiceTests.ConsultarAsync(
            _fixture, patente, SeguroVigenteServiceTests.DentroDeLaVigencia);

        Assert.True(respuesta.TieneSeguro);
        Assert.Equal(SeguroVigenteServiceTests.Patente, respuesta.Patente);
    }
}
