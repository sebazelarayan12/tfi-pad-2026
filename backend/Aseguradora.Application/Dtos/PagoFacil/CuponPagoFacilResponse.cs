namespace Aseguradora.Application.Dtos.PagoFacil;

/// <summary>Pago Fácil coupon of one installment (CU20).</summary>
public sealed record CuponPagoFacilResponse(
    Guid CuotaId,
    string NumeroPoliza,
    int NumeroCuota,
    decimal ImportePrimerVencimiento,
    DateOnly FechaPrimerVencimiento,
    decimal ImporteSegundoVencimiento,
    DateOnly FechaSegundoVencimiento,
    string CodigoBarras);
