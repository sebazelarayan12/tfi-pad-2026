namespace Aseguradora.Application.Dtos;

/// <summary>Valores públicos de estados y medios del contrato de pagos.</summary>
public static class ValoresPagoResponse
{
    public const string Pendiente = "PENDIENTE";
    public const string Aprobado = "APROBADO";
    public const string Rechazado = "RECHAZADO";
    public const string Caja = "CAJA";
    public const string Pasarela = "PASARELA";
    public const string PagoFacil = "PAGO_FACIL";
    public const string PendienteCae = "PENDIENTE_CAE";
    public const string Autorizada = "AUTORIZADA";
}
