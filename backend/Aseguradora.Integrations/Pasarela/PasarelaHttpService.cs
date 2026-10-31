using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Aseguradora.Application.Dtos;
using Aseguradora.Application.Exceptions;
using Aseguradora.Application.External;
using Aseguradora.Integrations.Http;
using Microsoft.Extensions.Logging;

namespace Aseguradora.Integrations.Pasarela;

/// <summary>
/// HTTP client implementation of <see cref="IPasarelaService"/> against contract 9.3
/// (<c>POST /api/pagos</c> and <c>GET /api/pagos/{idPago}</c>). Inherits resilience, timeout, the
/// <c>X-Api-Key</c> header and 5xx/network translation from <see cref="ClienteHttpBase"/> (US-T-02, C4).
/// </summary>
public sealed class PasarelaHttpService(string proveedor, HttpClient httpClient, ILogger<PasarelaHttpService> logger)
    : ClienteHttpBase(httpClient, logger), IPasarelaService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    /// <summary>Name used in log entries and error messages.</summary>
    protected override string Servicio => $"Pasarela {proveedor}";

    /// <inheritdoc />
    public async Task<PasarelaCrearPagoResponse> CrearPagoAsync(PasarelaCrearPagoRequest request, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(request);

        // Creating a payment twice would charge twice, so the retry policy must never resend it.
        using var pedido = new HttpRequestMessage(HttpMethod.Post, "/api/pagos")
        {
            Content = JsonContent.Create(request, options: JsonOptions)
        };
        using var respuesta = await EnviarAsync(pedido, ct, esIdempotente: false);

        var cuerpo = await LeerAsync<RespuestaCrearPago>(respuesta, ct);
        if (string.IsNullOrWhiteSpace(cuerpo.IdPago)
            || string.IsNullOrWhiteSpace(cuerpo.Estado)
            || string.IsNullOrWhiteSpace(cuerpo.UrlPago)
            || cuerpo.FechaExpiracion is null)
        {
            throw new ExternalServiceException($"{Servicio}: la respuesta del servicio externo no incluye todos los campos obligatorios.");
        }

        return new PasarelaCrearPagoResponse(
            cuerpo.IdPago.Trim(),
            cuerpo.Estado.Trim(),
            cuerpo.UrlPago.Trim(),
            cuerpo.FechaExpiracion.Value);
    }

    /// <inheritdoc />
    public async Task<PasarelaPagoResponse> ConsultarPagoAsync(string idPago, CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(idPago);

        using var pedido = new HttpRequestMessage(HttpMethod.Get, $"/api/pagos/{Uri.EscapeDataString(idPago.Trim())}");
        using var respuesta = await EnviarAsync(pedido, ct, esIdempotente: true);

        var cuerpo = await LeerAsync<RespuestaPago>(respuesta, ct);
        if (string.IsNullOrWhiteSpace(cuerpo.IdPago)
            || string.IsNullOrWhiteSpace(cuerpo.Estado)
            || cuerpo.Importe is null
            || cuerpo.Fecha is null)
        {
            throw new ExternalServiceException($"{Servicio}: la respuesta del servicio externo no incluye todos los campos obligatorios.");
        }

        return new PasarelaPagoResponse(
            cuerpo.IdPago.Trim(),
            string.IsNullOrWhiteSpace(cuerpo.ReferenciaExterna) ? null : cuerpo.ReferenciaExterna.Trim(),
            cuerpo.Estado.Trim(),
            cuerpo.Importe.Value,
            cuerpo.Fecha.Value,
            string.IsNullOrWhiteSpace(cuerpo.MedioPago) ? null : cuerpo.MedioPago.Trim());
    }

    private async Task<T> LeerAsync<T>(HttpResponseMessage respuesta, CancellationToken ct) where T : class
    {
        if (respuesta.StatusCode == HttpStatusCode.Unauthorized)
            throw new ExternalServiceException($"{Servicio}: el servicio externo rechazó la API key (401).");

        if (!respuesta.IsSuccessStatusCode)
            throw new ExternalServiceException($"{Servicio}: respuesta inesperada {(int)respuesta.StatusCode} del servicio externo.");

        try
        {
            return await respuesta.Content.ReadFromJsonAsync<T>(JsonOptions, ct)
                ?? throw new ExternalServiceException($"{Servicio}: el servicio externo devolvió una respuesta vacía.");
        }
        catch (JsonException ex)
        {
            throw new ExternalServiceException($"{Servicio}: el servicio externo devolvió un JSON inválido.", ex);
        }
    }

    private sealed record RespuestaCrearPago(
        string? IdPago,
        string? Estado,
        string? UrlPago,
        DateTime? FechaExpiracion);

    private sealed record RespuestaPago(
        string? IdPago,
        string? ReferenciaExterna,
        string? Estado,
        decimal? Importe,
        DateTime? Fecha,
        string? MedioPago);
}
