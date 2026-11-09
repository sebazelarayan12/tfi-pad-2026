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
/// HTTP client implementation of <see cref="IArcaService"/> against the FacturAR group
/// (<c>POST /v1/comprobantes</c>), the invoicing simulator the team uses in place of ARCA. Inherits
/// resilience, timeout, the <c>X-Api-Key</c> header and 5xx/network translation from
/// <see cref="ClienteHttpBase"/> (US-T-02, C4).
/// </summary>
/// <remarks>
/// The class keeps its name because the rest of the application talks to the <see cref="IArcaService"/>
/// contract. FacturAR resolves the issuing company from the API key, so <c>CuitEmisor</c> is not sent.
/// </remarks>
public sealed class ArcaHttpService(HttpClient httpClient, ILogger<ArcaHttpService> logger)
    : ClienteHttpBase(httpClient, logger), IArcaService
{
    private const string Aprobada = "APROBADA";
    private const string EstadoEmitido = "Emitido";
    private const decimal AlicuotaIva = 21m;
    private const int MaximoIdempotencyKey = 128;

    // FacturAR codes: invoices A/B/C are 1/6/11 and the receptor VAT condition is a number.
    private static readonly IReadOnlyDictionary<string, int> TiposComprobante =
        new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase) { ["A"] = 1, ["B"] = 6, ["C"] = 11 };

    private static readonly IReadOnlyDictionary<string, int> CondicionesIva =
        new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase)
        {
            ["RESPONSABLE_INSCRIPTO"] = 1,
            ["EXENTO"] = 4,
            ["CONSUMIDOR_FINAL"] = 5,
            ["MONOTRIBUTO"] = 6
        };

    // AFIP document type codes, the ones FacturAR shows in its manual ("99", "CUIT").
    private static readonly IReadOnlyDictionary<string, string> TiposDocumento =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["DNI"] = "96",
            ["CUIT"] = "80",
            ["CUIL"] = "86"
        };

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    /// <summary>Name used in log entries and error messages.</summary>
    protected override string Servicio => "FacturAR";

    /// <inheritdoc />
    public async Task<ArcaFacturaResponse> EmitirFacturaAsync(ArcaFacturaRequest request, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(request);
        if (string.IsNullOrWhiteSpace(request.ReferenciaExterna) || request.ReferenciaExterna.Length > MaximoIdempotencyKey)
            throw new ArgumentException($"La referencia externa es obligatoria y admite hasta {MaximoIdempotencyKey} caracteres.", nameof(request));

        var cuerpo = Mapear(request);

        // FacturAR returns the original invoice for the same Idempotency-Key and payload, so resending is safe.
        using var pedido = new HttpRequestMessage(HttpMethod.Post, "/v1/comprobantes")
        {
            Content = JsonContent.Create(cuerpo, options: JsonOptions)
        };
        pedido.Headers.TryAddWithoutValidation("Idempotency-Key", request.ReferenciaExterna);
        using var respuesta = await EnviarAsync(pedido, ct, esIdempotente: true);

        return await LeerComprobanteAsync(respuesta, ct);
    }

    /// <inheritdoc />
    /// <remarks>
    /// FacturAR has no lookup by voucher number (only by id, by CAE or through the list), and nothing in the
    /// application consults an invoice after issuing it, so this is not implemented against the real service.
    /// </remarks>
    public Task<ArcaFacturaResponse> ConsultarFacturaAsync(string numeroComprobante, CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(numeroComprobante);
        throw new ExternalServiceException($"{Servicio}: la consulta por número de comprobante no está disponible en el servicio externo.");
    }

    private PedidoComprobante Mapear(ArcaFacturaRequest request)
    {
        if (!TiposComprobante.TryGetValue(request.TipoComprobante.Trim(), out var tipo))
            throw new ArgumentException($"Tipo de comprobante desconocido: '{request.TipoComprobante}'.", nameof(request));
        if (!CondicionesIva.TryGetValue(request.Receptor.CondicionIva.Trim(), out var condicionIva))
            throw new ArgumentException($"Condición frente al IVA desconocida: '{request.Receptor.CondicionIva}'.", nameof(request));

        var tipoDocumento = request.Receptor.TipoDocumento.Trim();
        return new PedidoComprobante(
            PuntoVenta: request.PuntoVenta,
            TipoComprobante: tipo,
            Receptor: new PedidoReceptor(
                DocumentoTipo: TiposDocumento.GetValueOrDefault(tipoDocumento, tipoDocumento),
                DocumentoNumero: request.Receptor.NumeroDocumento.Trim(),
                RazonSocial: request.Receptor.Nombre.Trim(),
                CondicionIva: condicionIva),
            Items: [.. request.Items.Select(i => new PedidoItem(i.Descripcion, i.Cantidad, i.PrecioUnitario, AlicuotaIva))],
            // FacturAR checks it against the total it computes, so a rounding mismatch is rejected instead of issued.
            ImporteTotal: request.ImporteTotal,
            Observaciones: $"Pago {request.ReferenciaExterna}");
    }

    private async Task<ArcaFacturaResponse> LeerComprobanteAsync(HttpResponseMessage respuesta, CancellationToken ct)
    {
        if (!respuesta.IsSuccessStatusCode)
            throw await TraducirErrorAsync(respuesta, ct);

        try
        {
            var cuerpo = await respuesta.Content.ReadFromJsonAsync<RespuestaComprobante>(JsonOptions, ct);
            if (cuerpo is null)
                throw new ExternalServiceException($"{Servicio}: el servicio externo devolvió una respuesta vacía.");

            if (cuerpo.PuntoVenta is null
                || cuerpo.Numero is null
                || string.IsNullOrWhiteSpace(cuerpo.Cae)
                || cuerpo.CaeVencimiento is null
                || string.IsNullOrWhiteSpace(cuerpo.Estado))
            {
                throw new ExternalServiceException($"{Servicio}: la respuesta del servicio externo no incluye todos los campos obligatorios.");
            }

            if (!string.Equals(cuerpo.Estado.Trim(), EstadoEmitido, StringComparison.OrdinalIgnoreCase))
                throw new ExternalServiceException($"{Servicio}: el servicio externo no emitió el comprobante.");

            return new ArcaFacturaResponse(
                NumeroComprobante: $"{cuerpo.PuntoVenta:D4}-{cuerpo.Numero:D8}",
                Cae: cuerpo.Cae.Trim(),
                VencimientoCae: DateOnly.FromDateTime(cuerpo.CaeVencimiento.Value),
                Estado: Aprobada,
                UrlPdf: null);
        }
        catch (JsonException ex)
        {
            throw new ExternalServiceException($"{Servicio}: el servicio externo devolvió un JSON inválido.", ex);
        }
    }

    private async Task<ExternalServiceException> TraducirErrorAsync(HttpResponseMessage respuesta, CancellationToken ct)
    {
        string? codigo = null;
        try
        {
            codigo = (await respuesta.Content.ReadFromJsonAsync<RespuestaError>(JsonOptions, ct))?.Codigo;
        }
        catch (JsonException)
        {
            // The error body is only used to name the failure; an unreadable one is reported by status.
        }

        var estado = (int)respuesta.StatusCode;
        return respuesta.StatusCode == HttpStatusCode.Unauthorized
            ? new ExternalServiceException($"{Servicio}: el servicio externo rechazó la API key (401 {codigo}).")
            : new ExternalServiceException($"{Servicio}: respuesta inesperada {estado} del servicio externo ({codigo ?? "sin código"}).");
    }

    private sealed record PedidoComprobante(
        int PuntoVenta,
        int TipoComprobante,
        PedidoReceptor Receptor,
        IReadOnlyList<PedidoItem> Items,
        decimal ImporteTotal,
        string Observaciones);

    private sealed record PedidoReceptor(string DocumentoTipo, string DocumentoNumero, string RazonSocial, int CondicionIva);

    private sealed record PedidoItem(string Descripcion, decimal Cantidad, decimal PrecioUnitario, decimal AlicuotaIva);

    private sealed record RespuestaComprobante(
        int? PuntoVenta,
        long? Numero,
        string? Cae,
        DateTime? CaeVencimiento,
        string? Estado);

    private sealed record RespuestaError(string? Codigo);
}
