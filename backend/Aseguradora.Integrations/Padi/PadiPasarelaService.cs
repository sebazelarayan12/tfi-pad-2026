using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Aseguradora.Application.Dtos;
using Aseguradora.Application.Exceptions;
using Aseguradora.Application.External;
using Aseguradora.Integrations.Http;
using Microsoft.Extensions.Logging;

namespace Aseguradora.Integrations.Padi;

/// <summary>
/// <see cref="IPasarelaService"/> sobre la API de comercios de PADI (links de pago de un solo uso).
/// El identificador externo del pago es el id del <b>link</b>: es lo que se guarda en <c>Pago.IdExterno</c>
/// y lo que devuelve la consulta, así la conciliación y el webhook comparan contra el mismo valor.
/// Hereda resiliencia, timeout, header <c>X-Api-Key</c> y traducción de 5xx/red de <see cref="ClienteHttpBase"/>.
/// </summary>
public sealed class PadiPasarelaService : ClienteHttpBase, IPasarelaService
{
    /// <summary>Largo máximo del título del link según PADI.</summary>
    public const int LargoMaximoTitulo = 128;
    /// <summary>Largo máximo de la descripción del link según PADI.</summary>
    public const int LargoMaximoDescripcion = 512;
    /// <summary>Máximo de pagos que devuelve <c>received-payments</c> (no tiene paginación).</summary>
    public const int LimitePagosRecibidos = 100;

    private const string RutaLinks = "/api/v1/integrations/payment-links";
    private const string RutaPagosRecibidos = "/api/v1/integrations/received-payments";
    private const string MonedaEsperada = "ARS";
    private const string TipoSingleUse = "SingleUse";

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly string _proveedor;
    private readonly int _ttlMinutos;
    private readonly ILogger<PadiPasarelaService> _logger;

    /// <summary>Crea el cliente de PADI para el proveedor indicado.</summary>
    /// <param name="proveedor">Nombre interno del proveedor (por ejemplo <c>pasarela1</c>).</param>
    /// <param name="ttlMinutos">Minutos de vida de cada link creado.</param>
    /// <param name="httpClient">Cliente con base address, API key y resiliencia configurados.</param>
    /// <param name="logger">Logger del servicio.</param>
    public PadiPasarelaService(string proveedor, int ttlMinutos, HttpClient httpClient, ILogger<PadiPasarelaService> logger)
        : base(httpClient, logger)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(proveedor);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(ttlMinutos);
        _proveedor = proveedor;
        _ttlMinutos = ttlMinutos;
        _logger = logger;
    }

    /// <inheritdoc />
    protected override string Servicio => $"PADI ({_proveedor})";

    /// <inheritdoc />
    public async Task<PasarelaCrearPagoResponse> CrearPagoAsync(PasarelaCrearPagoRequest request, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentException.ThrowIfNullOrWhiteSpace(request.ReferenciaExterna);
        ArgumentException.ThrowIfNullOrWhiteSpace(request.Moneda);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(request.Importe);

        var cuerpoPedido = new PedidoCrearLink(
            request.Importe,
            Recortar($"{request.ReferenciaExterna} - {request.Descripcion}", LargoMaximoTitulo),
            request.Moneda,
            string.IsNullOrWhiteSpace(request.Descripcion) ? null : Recortar(request.Descripcion, LargoMaximoDescripcion),
            TipoSingleUse,
            _ttlMinutos);

        // PADI no es idempotente ni acepta referencia externa: un reintento crearía un segundo link cobrable.
        using var pedido = new HttpRequestMessage(HttpMethod.Post, RutaLinks)
        {
            Content = JsonContent.Create(cuerpoPedido, options: JsonOptions)
        };
        using var respuesta = await EnviarAsync(pedido, ct, esIdempotente: false).ConfigureAwait(false);

        var link = await LeerAsync<LinkPadi>(respuesta, ct).ConfigureAwait(false);
        if (link.Id is null
            || string.IsNullOrWhiteSpace(link.Status)
            || string.IsNullOrWhiteSpace(link.CheckoutUrl)
            || link.ExpiresAt is null)
        {
            throw new ExternalServiceException($"{Servicio}: la respuesta del servicio externo no incluye todos los campos obligatorios.");
        }

        return new PasarelaCrearPagoResponse(
            link.Id.Value.ToString(),
            MapearEstadoLink(link.Status),
            link.CheckoutUrl.Trim(),
            link.ExpiresAt.Value.UtcDateTime);
    }

    /// <inheritdoc />
    /// <remarks>
    /// <paramref name="idPago"/> es el id del link. Un pago <c>Succeeded</c> de ese link da <c>APROBADO</c>;
    /// un link vencido o cancelado sin pago exitoso da <c>CANCELADO</c>; en cualquier otro caso <c>PENDIENTE</c>.
    /// Un intento fallido no cierra el pago mientras el link siga activo, porque el cliente puede reintentar en PADI.
    /// </remarks>
    public async Task<PasarelaPagoResponse> ConsultarPagoAsync(string idPago, CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(idPago);
        if (!Guid.TryParse(idPago.Trim(), out var idLink))
            throw new ExternalServiceException($"{Servicio}: el identificador '{idPago}' no es un link de PADI.");

        var link = await ObtenerLinkAsync(idLink, ct).ConfigureAwait(false);
        var pagos = await ListarPagosRecibidosAsync(ct).ConfigureAwait(false);
        var exitosos = pagos
            .Where(p => p.PaymentLinkId == idLink && string.Equals(p.Status, EstadosPagoPadi.Succeeded, StringComparison.OrdinalIgnoreCase))
            .ToList();
        var id = idLink.ToString();

        if (exitosos.Count > 0)
        {
            if (exitosos.Count > 1)
                _logger.LogWarning("{Servicio}: el link {IdLink} tiene {Cantidad} pagos exitosos; se toma el más reciente",
                    Servicio, id, exitosos.Count);
            var pago = exitosos[0];
            if (!string.Equals(pago.Currency?.Trim(), MonedaEsperada, StringComparison.OrdinalIgnoreCase))
                throw new ExternalServiceException($"{Servicio}: el pago del link {id} no está en {MonedaEsperada}.");
            if (pago.Amount is null or <= 0 || pago.CreatedAt is null)
                throw new ExternalServiceException($"{Servicio}: el pago del link {id} no incluye importe o fecha.");

            return new PasarelaPagoResponse(
                id,
                null,
                ValoresPagoResponse.Aprobado,
                pago.Amount.Value,
                (pago.CompletedAt ?? pago.CreatedAt.Value).UtcDateTime,
                string.IsNullOrWhiteSpace(pago.PaymentMethod) ? null : pago.PaymentMethod.Trim());
        }

        if (link.Amount is null or <= 0 || link.CreatedAt is null || string.IsNullOrWhiteSpace(link.Status))
            throw new ExternalServiceException($"{Servicio}: la respuesta del servicio externo no incluye todos los campos obligatorios.");

        var estado = MapearEstadoLink(link.Status);
        if (estado == ValoresPagoResponse.Aprobado)
        {
            // Completed sin pago visible: puede quedar fuera de los últimos 100 pagos. No se aprueba sin importe confirmado.
            _logger.LogWarning("{Servicio}: el link {IdLink} figura Completed pero no se encontró su pago exitoso", Servicio, id);
            estado = ValoresPagoResponse.Pendiente;
        }

        return new PasarelaPagoResponse(id, null, estado, link.Amount.Value, link.CreatedAt.Value.UtcDateTime, null);
    }

    private async Task<LinkPadi> ObtenerLinkAsync(Guid idLink, CancellationToken ct)
    {
        using var pedido = new HttpRequestMessage(HttpMethod.Get, $"{RutaLinks}/{idLink}");
        using var respuesta = await EnviarAsync(pedido, ct).ConfigureAwait(false);
        if (respuesta.StatusCode == HttpStatusCode.NotFound)
            throw new ExternalServiceException($"{Servicio}: el link {idLink} no existe en PADI.");
        return await LeerAsync<LinkPadi>(respuesta, ct).ConfigureAwait(false);
    }

    private async Task<IReadOnlyList<PagoRecibidoPadi>> ListarPagosRecibidosAsync(CancellationToken ct)
    {
        using var pedido = new HttpRequestMessage(HttpMethod.Get, $"{RutaPagosRecibidos}?limit={LimitePagosRecibidos}");
        using var respuesta = await EnviarAsync(pedido, ct).ConfigureAwait(false);
        return await LeerAsync<List<PagoRecibidoPadi>>(respuesta, ct).ConfigureAwait(false);
    }

    private string MapearEstadoLink(string estado) => estado.Trim() switch
    {
        var e when e.Equals(EstadosLinkPadi.Active, StringComparison.OrdinalIgnoreCase) => ValoresPagoResponse.Pendiente,
        var e when e.Equals(EstadosLinkPadi.Completed, StringComparison.OrdinalIgnoreCase) => ValoresPagoResponse.Aprobado,
        var e when e.Equals(EstadosLinkPadi.Expired, StringComparison.OrdinalIgnoreCase)
            || e.Equals(EstadosLinkPadi.Cancelled, StringComparison.OrdinalIgnoreCase) => EstadoCancelado,
        _ => throw new ExternalServiceException($"{Servicio}: estado de link desconocido '{estado}'.")
    };

    private const string EstadoCancelado = "CANCELADO";

    private async Task<T> LeerAsync<T>(HttpResponseMessage respuesta, CancellationToken ct) where T : class
    {
        if (respuesta.StatusCode == HttpStatusCode.Unauthorized)
            throw new ExternalServiceException($"{Servicio}: el servicio externo rechazó la API key (401).");

        if (!respuesta.IsSuccessStatusCode)
        {
            var codigo = await LeerCodigoErrorAsync(respuesta, ct).ConfigureAwait(false);
            throw new ExternalServiceException(
                $"{Servicio}: respuesta inesperada {(int)respuesta.StatusCode}{(codigo is null ? "" : $" ({codigo})")} del servicio externo.");
        }

        try
        {
            return await respuesta.Content.ReadFromJsonAsync<T>(JsonOptions, ct).ConfigureAwait(false)
                ?? throw new ExternalServiceException($"{Servicio}: el servicio externo devolvió una respuesta vacía.");
        }
        catch (JsonException ex)
        {
            throw new ExternalServiceException($"{Servicio}: el servicio externo devolvió un JSON inválido.", ex);
        }
    }

    // ProblemDetails de PADI trae un "code" (INVALID_INPUT, PAYMENT_INTENT_NOT_FOUND...). Solo se usa para el mensaje.
    private static async Task<string?> LeerCodigoErrorAsync(HttpResponseMessage respuesta, CancellationToken ct)
    {
        try
        {
            var problema = await respuesta.Content.ReadFromJsonAsync<ProblemaPadi>(JsonOptions, ct).ConfigureAwait(false);
            return string.IsNullOrWhiteSpace(problema?.Code) ? null : problema.Code.Trim();
        }
        catch (Exception ex) when (ex is JsonException or NotSupportedException)
        {
            return null;
        }
    }

    private static string Recortar(string texto, int largo)
    {
        var limpio = texto.Trim();
        return limpio.Length <= largo ? limpio : limpio[..largo];
    }

    private static class EstadosLinkPadi
    {
        public const string Active = "Active";
        public const string Completed = "Completed";
        public const string Expired = "Expired";
        public const string Cancelled = "Cancelled";
    }

    private static class EstadosPagoPadi
    {
        public const string Succeeded = "Succeeded";
    }

    private sealed record PedidoCrearLink(
        decimal Amount,
        string Title,
        string Currency,
        string? Description,
        string Type,
        int TtlMinutes);

    private sealed record LinkPadi(
        Guid? Id,
        decimal? Amount,
        string? Currency,
        string? Status,
        DateTimeOffset? CreatedAt,
        DateTimeOffset? ExpiresAt,
        string? CheckoutUrl);

    private sealed record PagoRecibidoPadi(
        Guid? Id,
        Guid? PaymentLinkId,
        decimal? Amount,
        string? Currency,
        string? PaymentMethod,
        string? Status,
        DateTimeOffset? CreatedAt,
        DateTimeOffset? CompletedAt);

    private sealed record ProblemaPadi(string? Code);
}
