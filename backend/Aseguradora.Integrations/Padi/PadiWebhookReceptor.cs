using System.Security.Cryptography;
using System.Text.Json;
using Aseguradora.Application.Dtos;

namespace Aseguradora.Integrations.Padi;

/// <summary>Resultado de interpretar un aviso de PADI.</summary>
public enum TipoResultadoWebhookPadi
{
    /// <summary>Falta la firma o no coincide con el cuerpo: se responde 401.</summary>
    FirmaInvalida,
    /// <summary>Firma válida pero el cuerpo no es un aviso interpretable: se responde 400.</summary>
    CuerpoInvalido,
    /// <summary>Evento que no cambia el estado de un pago: se responde 200 sin procesar.</summary>
    Ignorado,
    /// <summary>Pago exitoso traducido a <see cref="PasarelaWebhookRequest"/>.</summary>
    Pago
}

/// <summary>Aviso de PADI interpretado; <see cref="Aviso"/> solo existe cuando <see cref="Tipo"/> es <see cref="TipoResultadoWebhookPadi.Pago"/>.</summary>
public sealed record ResultadoWebhookPadi(TipoResultadoWebhookPadi Tipo, PasarelaWebhookRequest? Aviso = null);

/// <summary>
/// Valida y traduce los avisos que PADI envía a <c>POST /api/webhooks/padi</c>. PADI firma el cuerpo
/// crudo con HMAC-SHA256 y el <c>webhookSecret</c> configurado, y manda la firma en hexadecimal en
/// <see cref="HeaderFirma"/>. No envía API key, así que la firma es la única autenticación.
/// </summary>
public sealed class PadiWebhookReceptor
{
    /// <summary>Header en el que PADI manda la firma.</summary>
    public const string HeaderFirma = "X-Padi-Signature";
    /// <summary>Único evento documentado por PADI.</summary>
    public const string EventoPagoExitoso = "payment.succeeded";
    /// <summary>Proveedor interno al que corresponde PADI.</summary>
    public const string Proveedor = "pasarela1";
    /// <summary>Largo máximo que admite <see cref="PasarelaWebhookRequest.MedioPago"/>.</summary>
    private const int LargoMaximoMedioPago = 50;
    private const int LargoFirmaHex = 64;

    private readonly byte[]? _secreto;

    /// <summary>Crea el receptor. Sin secreto, PADI se considera inactivo y todo aviso se rechaza.</summary>
    /// <param name="activo">Si PADI está seleccionado como cliente real de <see cref="Proveedor"/>.</param>
    /// <param name="secreto">Secreto compartido con PADI para la firma.</param>
    public PadiWebhookReceptor(bool activo, string? secreto)
    {
        Activo = activo && !string.IsNullOrWhiteSpace(secreto);
        _secreto = Activo ? System.Text.Encoding.UTF8.GetBytes(secreto!) : null;
    }

    /// <summary>Indica si el endpoint de PADI debe aceptar avisos.</summary>
    public bool Activo { get; }

    /// <summary>Valida la firma del cuerpo crudo y, si corresponde, lo traduce al aviso común de pasarelas.</summary>
    /// <param name="cuerpo">Bytes exactos recibidos.</param>
    /// <param name="firma">Valor del header <see cref="HeaderFirma"/>.</param>
    /// <exception cref="InvalidOperationException">PADI no está activo.</exception>
    public ResultadoWebhookPadi Interpretar(ReadOnlySpan<byte> cuerpo, string? firma)
    {
        if (_secreto is null)
            throw new InvalidOperationException("PADI no está activo.");
        if (!FirmaValida(cuerpo, firma, _secreto))
            return new(TipoResultadoWebhookPadi.FirmaInvalida);

        try
        {
            using var documento = JsonDocument.Parse(cuerpo.ToArray());
            var raiz = documento.RootElement;
            if (raiz.ValueKind != JsonValueKind.Object
                || !raiz.TryGetProperty("event", out var evento) || evento.ValueKind != JsonValueKind.String)
                return new(TipoResultadoWebhookPadi.CuerpoInvalido);
            if (!string.Equals(evento.GetString(), EventoPagoExitoso, StringComparison.Ordinal))
                return new(TipoResultadoWebhookPadi.Ignorado);
            if (!raiz.TryGetProperty("data", out var datos) || datos.ValueKind != JsonValueKind.Object)
                return new(TipoResultadoWebhookPadi.CuerpoInvalido);

            var idLink = Texto(datos, "paymentLinkId");
            if (!Guid.TryParse(idLink, out var link)
                || !datos.TryGetProperty("amount", out var importe) || !importe.TryGetDecimal(out var monto))
                return new(TipoResultadoWebhookPadi.CuerpoInvalido);

            var fecha = Fecha(datos, "completedAt") ?? Fecha(raiz, "occurredAt");
            if (fecha is null)
                return new(TipoResultadoWebhookPadi.CuerpoInvalido);

            var medio = Texto(datos, "paymentMethod")?.Trim();
            return new(TipoResultadoWebhookPadi.Pago, new PasarelaWebhookRequest
            {
                IdPago = link.ToString(),
                Estado = ValoresPagoResponse.Aprobado,
                Importe = monto,
                Fecha = fecha.Value,
                MedioPago = string.IsNullOrEmpty(medio) ? null : medio[..Math.Min(medio.Length, LargoMaximoMedioPago)]
            });
        }
        catch (JsonException)
        {
            return new(TipoResultadoWebhookPadi.CuerpoInvalido);
        }
    }

    /// <summary>Compara en tiempo constante la firma recibida con el HMAC-SHA256 del cuerpo.</summary>
    /// <param name="cuerpo">Bytes exactos recibidos.</param>
    /// <param name="firma">Firma en hexadecimal (se acepta en mayúsculas o minúsculas).</param>
    /// <param name="secreto">Secreto compartido.</param>
    public static bool FirmaValida(ReadOnlySpan<byte> cuerpo, string? firma, ReadOnlySpan<byte> secreto)
    {
        if (string.IsNullOrWhiteSpace(firma) || firma.Trim().Length != LargoFirmaHex)
            return false;

        byte[] recibida;
        try
        {
            recibida = Convert.FromHexString(firma.Trim());
        }
        catch (FormatException)
        {
            return false;
        }

        Span<byte> esperada = stackalloc byte[HMACSHA256.HashSizeInBytes];
        HMACSHA256.HashData(secreto, cuerpo, esperada);
        return CryptographicOperations.FixedTimeEquals(esperada, recibida);
    }

    private static string? Texto(JsonElement objeto, string propiedad) =>
        objeto.TryGetProperty(propiedad, out var valor) && valor.ValueKind == JsonValueKind.String ? valor.GetString() : null;

    private static DateTimeOffset? Fecha(JsonElement objeto, string propiedad) =>
        objeto.TryGetProperty(propiedad, out var valor) && valor.ValueKind == JsonValueKind.String
            && valor.TryGetDateTimeOffset(out var fecha)
            ? fecha
            : null;
}
