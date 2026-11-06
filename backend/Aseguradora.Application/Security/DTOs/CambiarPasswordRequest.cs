using System.ComponentModel.DataAnnotations;

namespace Aseguradora.Application.Security.DTOs;

/// <summary>
/// Body of <c>POST /api/auth/cambiar-password</c> (US-F1-09). The strength policy is enforced by
/// Identity when the password is saved, so its Spanish messages reach the client unchanged.
/// </summary>
public sealed record CambiarPasswordRequest(
    [Required(ErrorMessage = "La contraseña actual es obligatoria.")]
    string PasswordActual,
    [Required(ErrorMessage = "La contraseña nueva es obligatoria.")]
    string PasswordNueva);
