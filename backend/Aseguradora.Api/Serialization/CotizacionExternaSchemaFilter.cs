using Aseguradora.Api.Externo;
using Aseguradora.Domain.Enums;
using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace Aseguradora.Api.Serialization;

/// <summary>Documents uppercase string enums only on the external quote body (9.5 C).</summary>
public sealed class CotizacionExternaSchemaFilter : ISchemaFilter
{
    /// <inheritdoc />
    public void Apply(OpenApiSchema schema, SchemaFilterContext context)
    {
        if (context.Type != typeof(CotizacionExternaBody))
            return;

        schema.Properties["tipoVehiculo"] = EsquemaEnum<TipoVehiculo>();
        schema.Properties["uso"] = EsquemaEnum<UsoVehiculo>();
    }

    private static OpenApiSchema EsquemaEnum<T>() where T : struct, Enum => new()
    {
        Type = "string",
        Enum = Enum.GetNames<T>().Select(nombre => (IOpenApiAny)new OpenApiString(nombre.ToUpperInvariant())).ToList()
    };
}
