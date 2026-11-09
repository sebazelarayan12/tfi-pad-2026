namespace Aseguradora.Application.Security.DTOs;

/// <summary>Response of <c>GET /api/auth/yo</c>: the signed-in account, without the password (PB-04).</summary>
public sealed record YoResponse(string Id, string Email, string Nombre, string Apellido, string Rol);
