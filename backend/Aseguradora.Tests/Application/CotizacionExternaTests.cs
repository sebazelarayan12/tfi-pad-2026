using Aseguradora.Application.Dtos;
using Aseguradora.Domain.Enums;
using Aseguradora.Tests.Data;
using Aseguradora.Tests.Support;

namespace Aseguradora.Tests.Application;

public sealed class CotizacionExternaTests
{
    public static TheoryData<int, decimal> FactoresEdad => new()
    {
        { 24, 1.30m }, { 25, 1.00m }, { 65, 1.00m }, { 66, 1.15m }
    };

    [Theory]
    [MemberData(nameof(FactoresEdad))]
    public async Task CotizarExterno_aplica_factor_por_edad(int edad, decimal factor)
    {
        using var fixture = new SqliteDbFixture();
        await using var contexto = fixture.CreateContext();
        await CotizacionExternaServiceTests.PrepararPlanes(contexto);
        var resultado = await CotizacionExternaServiceTests.CrearServicio(contexto).CotizarExternoAsync(
            new CotizacionExternaRequest(TipoVehiculo.Moto, 2024, UsoVehiculo.Particular, edad));
        Assert.Equal(7000m * factor, Assert.Single(resultado.Opciones, o => o.CodigoPlan == "RC").PrimaMensual);
    }
}
