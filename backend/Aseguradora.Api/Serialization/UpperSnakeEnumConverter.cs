using System.Text.Json;
using System.Text.Json.Serialization;

namespace Aseguradora.Api.Serialization;

/// <summary>Enforces uppercase enum names on the external contract without changing global JSON options.</summary>
public sealed class UpperSnakeEnumConverter<TEnum> : JsonConverter<TEnum> where TEnum : struct, Enum
{
    /// <inheritdoc />
    public override TEnum Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.String)
        {
            var texto = reader.GetString();
            foreach (var valor in Enum.GetValues<TEnum>())
                if (texto == Enum.GetName(valor)!.ToUpperInvariant())
                    return valor;
        }
        throw new JsonException($"Se esperaba un nombre válido de {typeof(TEnum).Name} en mayúsculas.");
    }

    /// <inheritdoc />
    public override void Write(Utf8JsonWriter writer, TEnum value, JsonSerializerOptions options)
    {
        var nombre = Enum.GetName(value) ?? throw new JsonException("Valor de enum desconocido.");
        writer.WriteStringValue(nombre.ToUpperInvariant());
    }
}
