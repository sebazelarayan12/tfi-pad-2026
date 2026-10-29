namespace Aseguradora.Application.Dtos.Externo;

/// <summary>
/// Answer of the external insurance check (CU19). Only says whether the vehicle is covered today;
/// it never carries the holder's DNI or personal data. Without coverage every other field is null.
/// </summary>
public sealed record SeguroVigenteResponse(
    string Patente,
    bool TieneSeguro,
    string? NumeroPoliza = null,
    string? Plan = null,
    DateOnly? VigenteDesde = null,
    DateOnly? VigenteHasta = null);
