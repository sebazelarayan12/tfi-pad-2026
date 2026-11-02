using System.Text.Json;
using Aseguradora.Api.Serialization;
using Aseguradora.Domain.Enums;

namespace Aseguradora.Tests.Api;

public sealed class UpperSnakeEnumConverterTests
{
    private static JsonSerializerOptions Opciones<T>() where T : struct, Enum => new()
    {
        Converters = { new UpperSnakeEnumConverter<T>() }
    };

    [Fact]
    public void Lee_y_escribe_MOTO()
    {
        Assert.Equal(TipoVehiculo.Moto, JsonSerializer.Deserialize<TipoVehiculo>("\"MOTO\"", Opciones<TipoVehiculo>()));
        Assert.Equal("\"MOTO\"", JsonSerializer.Serialize(TipoVehiculo.Moto, Opciones<TipoVehiculo>()));
    }

    [Theory]
    [InlineData("\"moto\"")]
    [InlineData("\"Moto\"")]
    [InlineData("\"BICICLETA\"")]
    [InlineData("1")]
    [InlineData("\"1\"")]
    [InlineData("null")]
    [InlineData("true")]
    public void Rechaza_valores_fuera_del_contrato(string json) =>
        Assert.Throws<JsonException>(() => JsonSerializer.Deserialize<TipoVehiculo>(json, Opciones<TipoVehiculo>()));

    [Theory]
    [InlineData(UsoVehiculo.Particular, "PARTICULAR")]
    [InlineData(UsoVehiculo.Comercial, "COMERCIAL")]
    public void Lee_y_escribe_uso(UsoVehiculo uso, string texto)
    {
        var json = JsonSerializer.Serialize(texto);
        Assert.Equal(uso, JsonSerializer.Deserialize<UsoVehiculo>(json, Opciones<UsoVehiculo>()));
        Assert.Equal(json, JsonSerializer.Serialize(uso, Opciones<UsoVehiculo>()));
    }

    [Fact]
    public void Rechaza_escritura_de_valor_indefinido() =>
        Assert.Throws<JsonException>(() => JsonSerializer.Serialize((TipoVehiculo)999, Opciones<TipoVehiculo>()));
}
