namespace Aseguradora.Application.Dtos;

/// <summary>Invoice summary shown in each row of the payment list.</summary>
public sealed record PagoFacturaResumen(string Numero, string Estado);

/// <summary>One row of the payment list: who paid, which installments, how and the invoice state (CU18).</summary>
/// <param name="NumeroPoliza">Policy of the paid installments; the lowest number when a payment spans several.</param>
/// <param name="Cuotas">Installment numbers included in the payment, ascending.</param>
public sealed record PagoListadoResponse(
    Guid Id,
    string Numero,
    DateTime FechaCreacion,
    string ClienteNombre,
    string NumeroPoliza,
    IReadOnlyList<int> Cuotas,
    string Medio,
    decimal Importe,
    string Estado,
    PagoFacturaResumen? Factura);
