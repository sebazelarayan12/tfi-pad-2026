using Aseguradora.Application.External;
using Aseguradora.Integrations.Renaper;

namespace Aseguradora.Tests.Integrations;

public class RenaperMockServiceTests
{
    private readonly RenaperMockService _service = new();

    [Fact]
    public async Task Dni_conocido_devuelve_juan_carlos_perez_vigente()
    {
        var persona = await _service.ObtenerPorDniAsync("30123456", CancellationToken.None);

        Assert.NotNull(persona);
        Assert.Equal("30123456", persona.Dni);
        Assert.Equal("20301234565", persona.Cuil);
        Assert.Equal("Juan Carlos", persona.Nombre);
        Assert.Equal("Pérez", persona.Apellido);
        Assert.Equal(new DateOnly(1985, 3, 21), persona.FechaNacimiento);
        Assert.Equal('M', persona.Sexo);
        Assert.Equal(EstadoRenaper.Vigente, persona.Estado);
        Assert.Null(persona.FechaFallecimiento);
        Assert.Equal("San Martín", persona.Domicilio.Calle);
        Assert.Equal("1234", persona.Domicilio.Numero);
        Assert.Null(persona.Domicilio.Piso);
        Assert.Null(persona.Domicilio.Depto);
        Assert.Equal("San Miguel de Tucumán", persona.Domicilio.Localidad);
        Assert.Equal("Tucumán", persona.Domicilio.Provincia);
        Assert.Equal("4000", persona.Domicilio.CodigoPostal);
    }

    [Fact]
    public async Task Dni_vigente_menor_de_edad_devuelve_vigente()
    {
        var persona = await _service.ObtenerPorDniAsync("45123456", CancellationToken.None);

        Assert.NotNull(persona);
        Assert.Equal("Lucía", persona.Nombre);
        Assert.Equal("Fernández", persona.Apellido);
        Assert.Equal(new DateOnly(2010, 7, 12), persona.FechaNacimiento);
        Assert.Equal(EstadoRenaper.Vigente, persona.Estado);
        Assert.Null(persona.FechaFallecimiento);
    }

    [Fact]
    public async Task Dni_fallecido_devuelve_estado_fallecido()
    {
        var persona = await _service.ObtenerPorDniAsync("20111222", CancellationToken.None);

        Assert.NotNull(persona);
        Assert.Equal("Roberto Carlos", persona.Nombre);
        Assert.Equal("Sosa", persona.Apellido);
        Assert.Equal(EstadoRenaper.Fallecido, persona.Estado);
        Assert.Equal(new DateOnly(2024, 11, 2), persona.FechaFallecimiento);
    }

    [Fact]
    public async Task Dni_inexistente_devuelve_null()
    {
        var persona = await _service.ObtenerPorDniAsync("99999999", CancellationToken.None);

        Assert.Null(persona);
    }
}
