using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Policy;
using Microsoft.AspNetCore.Mvc;

namespace Aseguradora.Api.Security;

/// <summary>
/// Writes the 403 of a token that must change its temporary password as a <c>ProblemDetails</c>
/// with <c>code: PASSWORD_CAMBIO_REQUERIDO</c> (US-F1-09). Every other result keeps the default
/// behavior (401 challenge, plain 403).
/// </summary>
public sealed class ResultadoAutorizacionHandler : IAuthorizationMiddlewareResultHandler
{
    private const string Detalle = "Debés cambiar tu contraseña antes de continuar.";

    private readonly AuthorizationMiddlewareResultHandler _predeterminado = new();

    public async Task HandleAsync(
        RequestDelegate next,
        HttpContext context,
        AuthorizationPolicy policy,
        PolicyAuthorizationResult authorizeResult)
    {
        var pendiente = authorizeResult.Forbidden &&
            authorizeResult.AuthorizationFailure is { } fallo &&
            fallo.FailureReasons.Any(razon => razon.Message == PasswordVigenteRequirement.Codigo);

        if (!pendiente)
        {
            await _predeterminado.HandleAsync(next, context, policy, authorizeResult);
            return;
        }

        var problema = new ProblemDetails
        {
            Status = StatusCodes.Status403Forbidden,
            Title = "Forbidden",
            Detail = Detalle,
            Instance = context.Request.Path
        };
        // `codigo` is the name the front client reads (ExceptionMiddleware uses it too); `code` is kept
        // because the card of US-F1-09 names it.
        problema.Extensions["codigo"] = PasswordVigenteRequirement.Codigo;
        problema.Extensions["code"] = PasswordVigenteRequirement.Codigo;
        problema.Extensions["traceId"] = context.TraceIdentifier;

        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        await context.Response.WriteAsJsonAsync(problema, options: null, contentType: "application/problem+json");
    }
}
