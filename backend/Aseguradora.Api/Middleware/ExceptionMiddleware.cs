using Aseguradora.Application.Exceptions;
using Aseguradora.Domain.Exceptions;
using Microsoft.AspNetCore.Mvc;

namespace Aseguradora.Api.Middleware;

/// <summary>
/// Turns exceptions into ProblemDetails responses so controllers need no try/catch.
/// NotFound -> 404, BusinessRule -> 400, CredencialesInvalidas -> 401, ExternalService -> 502,
/// anything else -> 500.
/// </summary>
public class ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
{
    private const string UnexpectedErrorMessage = "Ocurrió un error inesperado.";
    private const string ProblemJson = "application/problem+json";

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception exception) when (!context.Response.HasStarted)
        {
            var (status, detail) = Map(exception);

            if (status == StatusCodes.Status500InternalServerError)
                logger.LogError(exception, "Unhandled exception on {Method} {Path}", context.Request.Method, context.Request.Path);
            else
                logger.LogWarning("{ExceptionType} on {Method} {Path}: {Message}",
                    exception.GetType().Name, context.Request.Method, context.Request.Path, exception.Message);

            var problem = new ProblemDetails
            {
                Status = status,
                Title = ReasonPhrases(status),
                Detail = detail,
                Instance = context.Request.Path
            };
            // Lets support match a client error report with the server log entry.
            problem.Extensions["traceId"] = context.TraceIdentifier;
            // Stable reason code for external clients (for example CLIENTE_NO_ENCONTRADO); absent when none is set.
            if (exception is NotFoundException { Codigo: { } codigo })
                problem.Extensions["codigo"] = codigo;

            context.Response.Clear();
            context.Response.StatusCode = status;
            if (exception is ServicioNoDisponibleException)
                context.Response.Headers.RetryAfter = ServicioNoDisponibleException.ReintentarEnSegundos.ToString(System.Globalization.CultureInfo.InvariantCulture);
            await context.Response.WriteAsJsonAsync(problem, options: null, contentType: ProblemJson);
        }
    }

    private static (int Status, string Detail) Map(Exception exception) => exception switch
    {
        NotFoundException => (StatusCodes.Status404NotFound, exception.Message),
        BusinessRuleException => (StatusCodes.Status400BadRequest, exception.Message),
        CredencialesInvalidasException => (StatusCodes.Status401Unauthorized, exception.Message),
        // Also covers TransicionInvalidaException, its subclass.
        ReglaDeDominioException => (StatusCodes.Status400BadRequest, exception.Message),
        ExternalServiceException => (StatusCodes.Status502BadGateway, exception.Message),
        ServicioNoDisponibleException => (StatusCodes.Status503ServiceUnavailable, exception.Message),
        // Never leak internal details of unexpected failures.
        _ => (StatusCodes.Status500InternalServerError, UnexpectedErrorMessage)
    };

    private static string ReasonPhrases(int status) => Microsoft.AspNetCore.WebUtilities.ReasonPhrases.GetReasonPhrase(status);
}
