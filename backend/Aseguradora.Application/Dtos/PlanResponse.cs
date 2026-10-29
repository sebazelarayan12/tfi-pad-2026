namespace Aseguradora.Application.Dtos;

/// <summary>
/// Read representation of a coverage plan (CU08).
/// </summary>
/// <param name="Id">Unique identifier of the plan.</param>
/// <param name="Codigo">Unique short code of the plan (e.g., RC, TC, TR).</param>
/// <param name="Nombre">Display name of the plan.</param>
/// <param name="Descripcion">Detailed description of the plan.</param>
/// <param name="PrimaBase">Base monthly premium in ARS (RN06, RN16).</param>
/// <param name="TiposPermitidos">Comma-separated allowed vehicle types (RN05).</param>
/// <param name="AntiguedadMaxima">Maximum vehicle age in years, or <see langword="null"/> if unlimited (RN05).</param>
/// <param name="Activo">Indicates whether the plan is active (RN15).</param>
public sealed record PlanResponse(
    Guid Id,
    string Codigo,
    string Nombre,
    string Descripcion,
    decimal PrimaBase,
    string TiposPermitidos,
    int? AntiguedadMaxima,
    bool Activo);
