namespace Aseguradora.Application.Dtos;

/// <summary>
/// What an external system (a payment gateway, for example) needs to offer a client a payment (CU13, contract 9.5 B).
/// It carries the stored state of each unpaid installment and never the client's contact data.
/// </summary>
public sealed record DeudaExternaResponse(
    string Dni,
    string Cliente,
    decimal TotalAdeudado,
    IReadOnlyList<DeudaExternaPoliza> Polizas);
