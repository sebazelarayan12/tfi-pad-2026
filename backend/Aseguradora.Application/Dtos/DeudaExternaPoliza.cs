namespace Aseguradora.Application.Dtos;

/// <summary>A policy of the client that still has unpaid installments (contract 9.5 B).</summary>
public sealed record DeudaExternaPoliza(
    string NumeroPoliza,
    string Patente,
    IReadOnlyList<DeudaExternaCuota> Cuotas);
