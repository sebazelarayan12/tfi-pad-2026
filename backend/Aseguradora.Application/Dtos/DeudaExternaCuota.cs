namespace Aseguradora.Application.Dtos;

/// <summary>
/// An unpaid installment. <c>Total</c> is <c>Importe</c> plus <c>Recargo</c>. <c>Estado</c> is the stored state,
/// <c>PENDIENTE</c> or <c>VENCIDA</c>, in uppercase as the contract requires.
/// </summary>
public sealed record DeudaExternaCuota(
    Guid IdCuota,
    int Numero,
    decimal Importe,
    decimal Recargo,
    decimal Total,
    DateOnly Vencimiento,
    string Estado);
