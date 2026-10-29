using Aseguradora.Domain.Enums;
using Aseguradora.Integrations.Dnrpa;

namespace Aseguradora.Tests.Integrations;

public class DnrpaMockServiceTests
{
    [Fact]
    public async Task ObtenerVehiculoAsync_con_patente_conocida_devuelve_datos()
    {
        var service = new DnrpaMockService();

        var ab123cd = await service.ObtenerVehiculoAsync("AB123CD", CancellationToken.None);
        var ae789fg = await service.ObtenerVehiculoAsync("ae789fg", CancellationToken.None);
        var ac456ef = await service.ObtenerVehiculoAsync("AC456EF", CancellationToken.None);

        Assert.NotNull(ab123cd);
        Assert.Equal("AB123CD", ab123cd.Patente);
        Assert.Equal("Toyota", ab123cd.Marca);
        Assert.Equal(2021, ab123cd.Anio);
        Assert.Equal(TipoVehiculo.Auto, ab123cd.Tipo);
        Assert.Equal("30123456", ab123cd.TitularDni);

        Assert.NotNull(ae789fg);
        Assert.Equal("30123456", ae789fg.TitularDni);

        Assert.NotNull(ac456ef);
        Assert.Equal("27111222", ac456ef.TitularDni);
    }

    [Fact]
    public async Task ObtenerVehiculoAsync_con_patente_desconocida_devuelve_null()
    {
        var service = new DnrpaMockService();

        var datos = await service.ObtenerVehiculoAsync("ZZ999ZZ", CancellationToken.None);

        Assert.Null(datos);
    }
}
