using Aseguradora.Domain.Enums;

namespace Aseguradora.Application.Dtos;

/// <summary>One row of the global installment list (PB-24).</summary>
public sealed record CuotaListItemResponse(
    Guid CuotaId,
    Guid PolizaId,
    string NumeroPoliza,
    string ClienteNombre,
    string ClienteApellido,
    int NumeroCuota,
    DateOnly FechaVencimiento,
    decimal Importe,
    decimal Recargo,
    EstadoCuota Estado);
