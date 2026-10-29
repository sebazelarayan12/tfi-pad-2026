using System.Text.RegularExpressions;
using Aseguradora.Data.Numeracion;
using Aseguradora.Data.Seed;
using Aseguradora.Tests.Fixtures;
using Microsoft.EntityFrameworkCore;

namespace Aseguradora.Tests.Data;

/// <summary>Needs the SQL Server sequence: skipped unless <c>ASEGURADORA_TESTS_DOCKER=1</c>.</summary>
[Collection(SqlServerCollection.Nombre)]
public class NumeradorPolizasSqlTests(SqlServerContainerFixture contenedor)
{
    [SkippableFact]
    public async Task SiguienteNumero_DevuelveNumerosConsecutivosConFormato()
    {
        Skip.IfNot(contenedor.Disponible, SqlServerContainerFixture.MotivoOmision);
        await using var contexto = contenedor.CrearContexto();
        var numerador = new NumeradorPolizasSql(contexto);

        var primero = await numerador.SiguienteNumeroAsync();
        var segundo = await numerador.SiguienteNumeroAsync();

        Assert.Matches(new Regex(@"^POL-\d{7}$"), primero);
        Assert.Equal(long.Parse(primero[4..]) + 1, long.Parse(segundo[4..]));
    }

    [SkippableFact]
    public async Task SiguienteNumero_NoRepiteElNumeroDeLaPolizaSembrada()
    {
        Skip.IfNot(contenedor.Disponible, SqlServerContainerFixture.MotivoOmision);
        await using var contexto = contenedor.CrearContexto();
        var sembrada = await contexto.Polizas.SingleAsync(p => p.Id == SeedData.PolizaId);

        var numero = await new NumeradorPolizasSql(contexto).SiguienteNumeroAsync();

        Assert.NotEqual(sembrada.Numero, numero);
        Assert.False(await contexto.Polizas.AnyAsync(p => p.Numero == numero));
    }
}
