using Microsoft.AspNetCore.Authorization;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace Aseguradora.Api.Security;

/// <summary>
/// Links each operation to the Swagger security scheme its authorization needs. Without this link
/// Swagger UI never sends the credentials it has stored, because a scheme only applies to the
/// operations that name it. The API key policy uses <c>ApiKey</c>; every other protected operation
/// uses the JWT <c>Bearer</c> scheme. An <c>[AllowAnonymous]</c> operation declares none.
/// </summary>
public sealed class SeguridadSwaggerFilter : IOperationFilter
{
    /// <inheritdoc />
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var metadata = context.ApiDescription.ActionDescriptor.EndpointMetadata;
        if (metadata.OfType<IAllowAnonymous>().Any())
            return;

        var autorizacion = metadata.OfType<IAuthorizeData>().ToList();
        if (autorizacion.Count == 0)
            return;

        var esquema = autorizacion.Any(a => a.Policy == Politicas.ApiKey) ? "ApiKey" : "Bearer";
        operation.Security.Add(new OpenApiSecurityRequirement
        {
            [new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = esquema } }] = []
        });
    }
}
