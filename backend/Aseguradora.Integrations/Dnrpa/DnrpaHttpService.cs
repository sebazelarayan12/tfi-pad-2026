using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Aseguradora.Application.Exceptions;
using Aseguradora.Application.External;
using Aseguradora.Integrations.Http;
using Microsoft.Extensions.Logging;

namespace Aseguradora.Integrations.Dnrpa;

/// <summary>
/// HTTP client implementation of <see cref="IDnrpaService"/> against contract 9.4 (<c>GET /api/vehiculos/{patente}</c>).
/// Inherits resilience, timeout, and 5xx/network translation from <see cref="ClienteHttpBase"/> (US-T-02, C4).
/// </summary>
public sealed class DnrpaHttpService(HttpClient httpClient, ILogger<DnrpaHttpService> logger)
    : ClienteHttpBase(httpClient, logger), IDnrpaService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase, allowIntegerValues: true) }
    };

    /// <inheritdoc />
    public async Task<DatosDnrpa?> ObtenerVehiculoAsync(string patente, CancellationToken ct = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(patente);

        var normalizada = Uri.EscapeDataString(patente.Trim().ToUpperInvariant());
        using var request = new HttpRequestMessage(HttpMethod.Get, $"/api/vehiculos/{normalizada}");
        using var response = await EnviarAsync(request, ct, esIdempotente: true);

        if (response.StatusCode == HttpStatusCode.NotFound)
            return null;

        if (!response.IsSuccessStatusCode)
            throw new ExternalServiceException($"{Servicio}: respuesta inesperada {(int)response.StatusCode} del servicio externo.");

        try
        {
            var datos = await response.Content.ReadFromJsonAsync<DatosDnrpa>(JsonOptions, ct);
            return datos ?? throw new ExternalServiceException($"{Servicio}: el servicio externo devolvió una respuesta vacía.");
        }
        catch (JsonException ex)
        {
            throw new ExternalServiceException($"{Servicio}: el servicio externo devolvió un JSON inválido.", ex);
        }
    }
}
