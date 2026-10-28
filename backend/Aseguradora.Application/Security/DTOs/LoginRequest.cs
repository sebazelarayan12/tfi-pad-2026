using System.ComponentModel.DataAnnotations;

namespace Aseguradora.Application.Security.DTOs;

/// <summary>Credentials of <c>POST /api/auth/login</c> (CU01).</summary>
public sealed record LoginRequest(
    [Required(ErrorMessage = "El email es obligatorio.")]
    [EmailAddress(ErrorMessage = "El email no tiene un formato válido.")]
    string Email,
    [Required(ErrorMessage = "La contraseña es obligatoria.")]
    string Password);
