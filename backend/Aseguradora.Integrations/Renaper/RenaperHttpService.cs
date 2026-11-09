using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Aseguradora.Application.Exceptions;
using Aseguradora.Application.External;
using Aseguradora.Integrations.Http;
using Microsoft.Extensions.Logging;

namespace Aseguradora.Integrations.Renaper;

/// <summary>
/// HTTP client implementation of <see cref="IRenaperService"/> against the OpenRENAPER group
/// (<c>POST /api/v1/consultas</c>, no authentication). Inherits resilience, timeout and 5xx/network
/// translation from <see cref="ClienteHttpBase"/> (US-T-02, C4).
/// </summary>
/// <remarks>
/// OpenRENAPER answers with six optional fields only (name, DNI, CUIT, age, sex, province). Nothing is
/// inferred from what it omits: the missing data stays <see langword="null"/> in <see cref="PersonaRenaper"/>.
/// It has no vital status, so every person it returns is <see cref="EstadoRenaper.Vigente"/>.
/// </remarks>
public sealed class RenaperHttpService(HttpClient httpClient, ILogger<RenaperHttpService> logger)
    : ClienteHttpBase(httpClient, logger), IRenaperService
{
    private const string TipoDni = "dni";
    private const string TipoCuit = "cuit";
    private const string ConsultaAmbigua = "consulta_ambigua";

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    /// <summary>Name used in log entries and error messages.</summary>
    protected override string Servicio => "Renaper";

    /// <inheritdoc />
    public Task<PersonaRenaper?> ObtenerPorDniAsync(string dni, CancellationToken ct = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(dni);
        return ConsultarAsync(TipoDni, dni.Trim(), ct);
    }

    /// <inheritdoc />
    public Task<PersonaRenaper?> ObtenerPorCuilAsync(string cuil, CancellationToken ct = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(cuil);
        // OpenRENAPER looks up a CUIL with tipo "cuit" ("cuil" is not accepted).
        return ConsultarAsync(TipoCuit, cuil.Trim(), ct);
    }

    private async Task<PersonaRenaper?> ConsultarAsync(string tipo, string numero, CancellationToken ct)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/consultas")
        {
            Content = JsonContent.Create(new SolicitudConsulta(tipo, numero), options: JsonOptions)
        };
        using var response = await EnviarAsync(request, ct, esIdempotente: true);

        switch (response.StatusCode)
        {
            case HttpStatusCode.NotFound:
                return null;
            case HttpStatusCode.Conflict:
                throw await TraducirConflictoAsync(response, ct);
            case HttpStatusCode.TooManyRequests:
                throw new ExternalServiceException($"{Servicio}: se superó el límite de consultas del servicio externo (429).");
        }

        if (!response.IsSuccessStatusCode)
            throw new ExternalServiceException($"{Servicio}: respuesta inesperada {(int)response.StatusCode} del servicio externo.");

        try
        {
            var respuesta = await response.Content.ReadFromJsonAsync<RespuestaConsulta>(JsonOptions, ct);
            if (respuesta is null)
                throw new ExternalServiceException($"{Servicio}: el servicio externo devolvió una respuesta vacía.");

            return Mapear(respuesta, tipo, numero);
        }
        catch (JsonException ex)
        {
            throw new ExternalServiceException($"{Servicio}: el servicio externo devolvió un JSON inválido.", ex);
        }
    }

    private async Task<ExternalServiceException> TraducirConflictoAsync(HttpResponseMessage response, CancellationToken ct)
    {
        string? codigo = null;
        try
        {
            codigo = (await response.Content.ReadFromJsonAsync<RespuestaError>(JsonOptions, ct))?.Codigo;
        }
        catch (JsonException)
        {
            // An unreadable 409 is reported below as an unexpected answer.
        }

        return string.Equals(codigo, ConsultaAmbigua, StringComparison.Ordinal)
            ? new PersonaAmbiguaException($"{Servicio}: el DNI corresponde a varias personas; hay que consultar por CUIL.")
            : new ExternalServiceException($"{Servicio}: el servicio externo respondió 409 ({codigo ?? "sin código"}).");
    }

    private PersonaRenaper Mapear(RespuestaConsulta respuesta, string tipo, string numero)
    {
        if (string.IsNullOrWhiteSpace(respuesta.Nombre))
            throw new ExternalServiceException($"{Servicio}: la respuesta del servicio externo no incluye el nombre.");

        var cuil = string.IsNullOrWhiteSpace(respuesta.Cuit) ? null : respuesta.Cuit.Trim();
        var dni = !string.IsNullOrWhiteSpace(respuesta.Dni)
            ? respuesta.Dni.Trim()
            : tipo == TipoDni ? numero : DniDelCuil(cuil ?? numero);

        return new PersonaRenaper(
            Dni: dni,
            Cuil: cuil ?? (tipo == TipoCuit ? numero : null),
            Nombre: respuesta.Nombre.Trim(),
            Apellido: null,
            FechaNacimiento: null,
            Sexo: MapearSexo(respuesta.Sexo),
            Domicilio: null,
            Estado: EstadoRenaper.Vigente,
            FechaFallecimiento: null,
            Edad: respuesta.Edad is >= 0 ? respuesta.Edad : null);
    }

    /// <summary>
    /// The eight middle digits of an individual's CUIL/CUIT (prefix 20, 23, 24 or 27) are the DNI. A company
    /// (prefix 30, 33, 34) has no DNI, so its CUIT is returned unchanged instead of inventing one.
    /// </summary>
    private static string DniDelCuil(string cuil) =>
        cuil.Length == 11 && cuil[..2] is "20" or "23" or "24" or "27" ? cuil.Substring(2, 8).TrimStart('0') : cuil;

    private static char? MapearSexo(string? sexo) => sexo?.Trim().ToUpperInvariant() switch
    {
        "MASCULINO" or "M" => 'M',
        "FEMENINO" or "F" => 'F',
        _ => null
    };

    private sealed record SolicitudConsulta(string Tipo, string Numero);

    private sealed record RespuestaConsulta(
        string? Nombre,
        string? Dni,
        string? Cuit,
        int? Edad,
        string? Sexo,
        [property: JsonPropertyName("provincia_ubicacion")] string? ProvinciaUbicacion);

    private sealed record RespuestaError(string? Codigo);
}
