using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Aseguradora.Application.Exceptions;
using Aseguradora.Application.External;
using Aseguradora.Integrations.Http;
using Microsoft.Extensions.Logging;

namespace Aseguradora.Integrations.Renaper;

/// <summary>
/// HTTP client implementation of <see cref="IRenaperService"/> against contract 9.1
/// (<c>GET /api/personas/{dni}</c>). Inherits resilience, timeout, the <c>X-Api-Key</c> header
/// and 5xx/network translation from <see cref="ClienteHttpBase"/> (US-T-02, C4).
/// </summary>
public sealed class RenaperHttpService(HttpClient httpClient, ILogger<RenaperHttpService> logger)
    : ClienteHttpBase(httpClient, logger), IRenaperService
{
    private const string PersonaNoEncontrada = "PERSONA_NO_ENCONTRADA";
    private const string EstadoVigente = "VIGENTE";
    private const string EstadoFallecido = "FALLECIDO";

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    /// <summary>Name used in log entries and error messages.</summary>
    protected override string Servicio => "Renaper";

    /// <inheritdoc />
    public async Task<PersonaRenaper?> ObtenerPorDniAsync(string dni, CancellationToken ct = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(dni);

        var normalizado = Uri.EscapeDataString(dni.Trim());
        using var request = new HttpRequestMessage(HttpMethod.Get, $"/api/personas/{normalizado}");
        using var response = await EnviarAsync(request, ct, esIdempotente: true);

        if (response.StatusCode == HttpStatusCode.NotFound)
            return await EsPersonaNoEncontradaAsync(response, ct)
                ? null
                : throw new ExternalServiceException($"{Servicio}: el servicio externo respondió 404 sin el código {PersonaNoEncontrada}.");

        if (!response.IsSuccessStatusCode)
            throw new ExternalServiceException($"{Servicio}: respuesta inesperada {(int)response.StatusCode} del servicio externo.");

        try
        {
            var respuesta = await response.Content.ReadFromJsonAsync<RespuestaRenaper>(JsonOptions, ct);
            if (respuesta is null)
                throw new ExternalServiceException($"{Servicio}: el servicio externo devolvió una respuesta vacía.");

            return Mapear(respuesta);
        }
        catch (JsonException ex)
        {
            throw new ExternalServiceException($"{Servicio}: el servicio externo devolvió un JSON inválido.", ex);
        }
    }

    private async Task<bool> EsPersonaNoEncontradaAsync(HttpResponseMessage response, CancellationToken ct)
    {
        try
        {
            var error = await response.Content.ReadFromJsonAsync<RespuestaError>(JsonOptions, ct);
            return string.Equals(error?.Codigo, PersonaNoEncontrada, StringComparison.Ordinal);
        }
        catch (JsonException ex)
        {
            throw new ExternalServiceException($"{Servicio}: el servicio externo devolvió un JSON inválido en la respuesta 404.", ex);
        }
    }

    private PersonaRenaper Mapear(RespuestaRenaper respuesta)
    {
        var sexo = respuesta.Sexo?.Trim();
        if (string.IsNullOrWhiteSpace(respuesta.Dni)
            || string.IsNullOrWhiteSpace(respuesta.Cuil)
            || string.IsNullOrWhiteSpace(respuesta.Nombre)
            || string.IsNullOrWhiteSpace(respuesta.Apellido)
            || respuesta.FechaNacimiento is null
            || sexo is not { Length: 1 }
            || respuesta.Domicilio is null
            || string.IsNullOrWhiteSpace(respuesta.Estado))
        {
            throw new ExternalServiceException($"{Servicio}: la respuesta del servicio externo no incluye todos los campos obligatorios.");
        }

        var domicilio = respuesta.Domicilio;
        if (string.IsNullOrWhiteSpace(domicilio.Calle)
            || string.IsNullOrWhiteSpace(domicilio.Numero)
            || string.IsNullOrWhiteSpace(domicilio.Localidad)
            || string.IsNullOrWhiteSpace(domicilio.Provincia)
            || string.IsNullOrWhiteSpace(domicilio.CodigoPostal))
        {
            throw new ExternalServiceException($"{Servicio}: la respuesta del servicio externo no incluye el domicilio completo.");
        }

        var estado = respuesta.Estado.Trim().ToUpperInvariant() switch
        {
            EstadoVigente => EstadoRenaper.Vigente,
            EstadoFallecido => EstadoRenaper.Fallecido,
            _ => throw new ExternalServiceException($"{Servicio}: el servicio externo devolvió un estado desconocido.")
        };

        return new PersonaRenaper(
            Dni: respuesta.Dni.Trim(),
            Cuil: respuesta.Cuil.Trim(),
            Nombre: respuesta.Nombre.Trim(),
            Apellido: respuesta.Apellido.Trim(),
            FechaNacimiento: respuesta.FechaNacimiento.Value,
            Sexo: char.ToUpperInvariant(sexo[0]),
            Domicilio: new DomicilioRenaper(
                Calle: domicilio.Calle.Trim(),
                Numero: domicilio.Numero.Trim(),
                Piso: string.IsNullOrWhiteSpace(domicilio.Piso) ? null : domicilio.Piso.Trim(),
                Depto: string.IsNullOrWhiteSpace(domicilio.Depto) ? null : domicilio.Depto.Trim(),
                Localidad: domicilio.Localidad.Trim(),
                Provincia: domicilio.Provincia.Trim(),
                CodigoPostal: domicilio.CodigoPostal.Trim()),
            Estado: estado,
            FechaFallecimiento: respuesta.FechaFallecimiento);
    }

    private sealed record RespuestaRenaper(
        string? Dni,
        string? Cuil,
        string? Nombre,
        string? Apellido,
        DateOnly? FechaNacimiento,
        string? Sexo,
        DomicilioRespuesta? Domicilio,
        string? Estado,
        DateOnly? FechaFallecimiento);

    private sealed record DomicilioRespuesta(
        string? Calle,
        string? Numero,
        string? Piso,
        string? Depto,
        string? Localidad,
        string? Provincia,
        string? CodigoPostal);

    private sealed record RespuestaError(string? Codigo);
}
