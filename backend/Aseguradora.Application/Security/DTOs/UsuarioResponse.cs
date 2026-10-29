namespace Aseguradora.Application.Security.DTOs;

/// <summary>
/// Response of <c>POST /api/auth/usuarios</c>. It exposes only the id, the email and the role,
/// never the password or the persisted entity (US-F1-03).
/// </summary>
public sealed record UsuarioResponse(string Id, string Email, string Rol);
