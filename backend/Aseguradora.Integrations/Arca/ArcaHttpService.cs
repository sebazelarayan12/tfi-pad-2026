using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Aseguradora.Application.Dtos;
using Aseguradora.Application.Exceptions;
using Aseguradora.Application.External;
using Aseguradora.Integrations.Http;
using Microsoft.Extensions.Logging;

namespace Aseguradora.Integrations.Arca;

/// <summary>
/// HTTP client implementation of <see cref="IArcaService"/> against contract 9.2
/// (<c>POST /api/facturas</c> and <c>GET /api/facturas/{numeroComprobante}</c>). Inherits resilience,
/// timeout, the <c>X-Api-Key</c> header and 5xx/network translation from <see cref="ClienteHttpBase"/> (US-T-02, C4).
/// </summary>
public sealed class ArcaHttpService(HttpClient httpClient, ILogger<ArcaHttpService> logger)
    : ClienteHttpBase(httpClient, logger), IArcaService
{
    private const string Aprobada = "APROBADA";

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    /// <summary>Name used in log entries and error messages.</summary>
    protected override string Servicio => "ARCA";

    /// <inheritdoc />
    public async Task<ArcaFacturaResponse> EmitirFacturaAsync(ArcaFacturaRequest request, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(request);

        // ARCA returns the same invoice for the same referenciaExterna (9.2), so resending the POST is safe.
        using var pedido = new HttpRequestMessage(HttpMethod.Post, "/api/facturas")
        {
            Content = JsonContent.Create(request, options: JsonOptions)
        };
        using var respuesta = await EnviarAsync(pedido, ct, esIdempotente: true);

        return await LeerFacturaAsync(respuesta, ct);
    }

    /// <inheritdoc />
    public async Task<ArcaFacturaResponse> ConsultarFacturaAsync(string numeroComprobante, CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(numeroComprobante);

        using var pedido = new HttpRequestMessage(HttpMethod.Get, $"/api/facturas/{Uri.EscapeDataString(numeroComprobante.Trim())}");
        using var respuesta = await EnviarAsync(pedido, ct, esIdempotente: true);

        return await LeerFacturaAsync(respuesta, ct);
    }

    private async Task<ArcaFacturaResponse> LeerFacturaAsync(HttpResponseMessage respuesta, CancellationToken ct)
    {
        if (respuesta.StatusCode == HttpStatusCode.Unauthorized)
            throw new ExternalServiceException($"{Servicio}: el servicio externo rechazó la API key (401).");

        if (!respuesta.IsSuccessStatusCode)
            throw new ExternalServiceException($"{Servicio}: respuesta inesperada {(int)respuesta.StatusCode} del servicio externo.");

        try
        {
            var cuerpo = await respuesta.Content.ReadFromJsonAsync<RespuestaFactura>(JsonOptions, ct);
            if (cuerpo is null)
                throw new ExternalServiceException($"{Servicio}: el servicio externo devolvió una respuesta vacía.");

            if (string.IsNullOrWhiteSpace(cuerpo.NumeroComprobante)
                || string.IsNullOrWhiteSpace(cuerpo.Cae)
                || cuerpo.VencimientoCae is null
                || string.IsNullOrWhiteSpace(cuerpo.Estado))
            {
                throw new ExternalServiceException($"{Servicio}: la respuesta del servicio externo no incluye todos los campos obligatorios.");
            }

            if (!string.Equals(cuerpo.Estado.Trim(), Aprobada, StringComparison.Ordinal))
                throw new ExternalServiceException($"{Servicio}: el servicio externo no aprobó la factura.");

            return new ArcaFacturaResponse(
                cuerpo.NumeroComprobante.Trim(),
                cuerpo.Cae.Trim(),
                cuerpo.VencimientoCae.Value,
                Aprobada,
                string.IsNullOrWhiteSpace(cuerpo.UrlPdf) ? null : cuerpo.UrlPdf.Trim());
        }
        catch (JsonException ex)
        {
            throw new ExternalServiceException($"{Servicio}: el servicio externo devolvió un JSON inválido.", ex);
        }
    }

    private sealed record RespuestaFactura(
        string? NumeroComprobante,
        string? Cae,
        DateOnly? VencimientoCae,
        string? Estado,
        string? UrlPdf);
}
