using System.Text.Json;
using Aseguradora.Api.Middleware;
using Aseguradora.Application.Exceptions;
using Aseguradora.Domain.Exceptions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;

namespace Aseguradora.Tests.Api;

public class ExceptionMiddlewareTests
{
    private static async Task<(int Status, string ContentType, JsonElement Body)> InvokeAsync(Exception? exception)
    {
        var middleware = new ExceptionMiddleware(
            _ => exception is null ? Task.CompletedTask : throw exception,
            NullLogger<ExceptionMiddleware>.Instance);

        var context = new DefaultHttpContext();
        context.Request.Path = "/api/test";
        context.Response.Body = new MemoryStream();

        await middleware.InvokeAsync(context);

        context.Response.Body.Position = 0;
        var body = await JsonDocument.ParseAsync(context.Response.Body);
        return (context.Response.StatusCode, context.Response.ContentType!, body.RootElement.Clone());
    }

    [Theory]
    [InlineData(typeof(NotFoundException), 404)]
    [InlineData(typeof(BusinessRuleException), 400)]
    [InlineData(typeof(ExternalServiceException), 502)]
    public async Task Maps_each_application_exception_to_its_status_and_message(Type exceptionType, int expectedStatus)
    {
        var exception = (Exception)Activator.CreateInstance(exceptionType, "motivo de prueba")!;

        var (status, contentType, body) = await InvokeAsync(exception);

        Assert.Equal(expectedStatus, status);
        Assert.StartsWith("application/problem+json", contentType);
        Assert.Equal(expectedStatus, body.GetProperty("status").GetInt32());
        Assert.Equal("motivo de prueba", body.GetProperty("detail").GetString());
        Assert.Equal("/api/test", body.GetProperty("instance").GetString());
    }

    [Fact]
    public async Task CredencialesInvalidas_Responde401ConMensajeGenerico()
    {
        var (status, contentType, body) = await InvokeAsync(new CredencialesInvalidasException());

        Assert.Equal(401, status);
        Assert.StartsWith("application/problem+json", contentType);
        Assert.Equal(CredencialesInvalidasException.Mensaje, body.GetProperty("detail").GetString());
    }

    [Fact]
    public async Task TransicionInvalida_Responde400ProblemDetails()
    {
        var (status, contentType, body) = await InvokeAsync(new TransicionInvalidaException("Transición no permitida."));

        Assert.Equal(400, status);
        Assert.StartsWith("application/problem+json", contentType);
        Assert.Equal(400, body.GetProperty("status").GetInt32());
        Assert.Equal("Transición no permitida.", body.GetProperty("detail").GetString());
    }

    [Fact]
    public async Task ReglaDeDominio_Responde400ProblemDetails()
    {
        var (status, _, body) = await InvokeAsync(new ReglaDeDominioException("Vigencia inválida."));

        Assert.Equal(400, status);
        Assert.Equal("Vigencia inválida.", body.GetProperty("detail").GetString());
    }

    [Fact]
    public async Task Unexpected_exception_returns_500_without_leaking_internal_details()
    {
        var (status, _, body) = await InvokeAsync(new InvalidOperationException("connection string leaked"));

        Assert.Equal(500, status);
        Assert.Equal("Ocurrió un error inesperado.", body.GetProperty("detail").GetString());
        Assert.DoesNotContain("leaked", body.GetRawText());
    }

    [Fact]
    public async Task ExceptionMiddleware_Error500_IncluyeTraceId()
    {
        var (status, _, body) = await InvokeAsync(new InvalidOperationException("boom"));

        Assert.Equal(500, status);
        Assert.False(string.IsNullOrWhiteSpace(body.GetProperty("traceId").GetString()));
        Assert.DoesNotContain("boom", body.GetRawText());
    }

    [Fact]
    public async Task Request_without_exception_passes_through_untouched()
    {
        var middleware = new ExceptionMiddleware(
            context =>
            {
                context.Response.StatusCode = StatusCodes.Status204NoContent;
                return Task.CompletedTask;
            },
            NullLogger<ExceptionMiddleware>.Instance);
        var context = new DefaultHttpContext();

        await middleware.InvokeAsync(context);

        Assert.Equal(204, context.Response.StatusCode);
    }
}
