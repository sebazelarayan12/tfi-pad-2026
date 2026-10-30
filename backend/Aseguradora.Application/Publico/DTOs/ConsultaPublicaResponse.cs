namespace Aseguradora.Application.Publico.DTOs;

/// <summary>
/// What the public web shows for a policy. It has no ids or entities (RN20): only the stored
/// product, vehicle and installment data.
/// </summary>
public sealed record ConsultaPublicaResponse(
    string NumeroPoliza,
    string Estado,
    bool CoberturaVigente,
    DateOnly VigenteDesde,
    DateOnly VigenteHasta,
    PlanPublico Plan,
    VehiculoPublico Vehiculo,
    IReadOnlyList<CuotaPublica> Cuotas);

/// <summary>Contracted plan.</summary>
public sealed record PlanPublico(string Codigo, string Nombre);

/// <summary>Insured vehicle.</summary>
public sealed record VehiculoPublico(string Patente, string Marca, string Modelo, int Anio);

/// <summary>Installment with its surcharge and total. The state is the stored one (F3 CU14 updates it).</summary>
public sealed record CuotaPublica(
    int Numero,
    decimal Importe,
    decimal Recargo,
    decimal Total,
    DateOnly Vencimiento,
    string Estado);
