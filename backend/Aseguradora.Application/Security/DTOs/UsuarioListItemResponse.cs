namespace Aseguradora.Application.Security.DTOs;

/// <summary>One row of <c>GET /api/usuarios</c> (PB-04).</summary>
/// <param name="Activo"><c>false</c> while the account is locked out.</param>
/// <param name="UltimoIngreso">Always <see langword="null"/> for now: the last login is not recorded yet.</param>
public sealed record UsuarioListItemResponse(
    string Id,
    string Email,
    string Nombre,
    string Apellido,
    string Rol,
    bool Activo,
    DateTime? UltimoIngreso);
