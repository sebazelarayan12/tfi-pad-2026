namespace Aseguradora.Application.Security.DTOs;

/// <summary>Body of <c>PATCH /api/usuarios/{id}/activo</c> (PB-04).</summary>
public sealed record CambiarActivoRequest(bool Activo);
