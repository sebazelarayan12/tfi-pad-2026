using System.ComponentModel.DataAnnotations;

namespace Aseguradora.Application.Security.DTOs;

/// <summary>
/// Body of <c>POST /api/auth/usuarios</c> (CU03). The role is limited to the ones an
/// administrator can assign; a client is not a user account (RN17).
/// </summary>
public sealed record CrearUsuarioRequest(
    [Required(ErrorMessage = "El email es obligatorio.")]
    [EmailAddress(ErrorMessage = "El email no tiene un formato válido.")]
    [StringLength(256, ErrorMessage = "El email no puede superar los 256 caracteres.")]
    string Email,
    [Required(ErrorMessage = "La contraseña es obligatoria.")]
    string Password,
    [Required(ErrorMessage = "El rol es obligatorio.")]
    [AllowedValues(Roles.Administrador, Roles.Empleado,
        ErrorMessage = "El rol debe ser Administrador o Empleado.")]
    string Rol,
    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [StringLength(100, ErrorMessage = "El nombre no puede superar los 100 caracteres.")]
    string Nombre,
    [Required(ErrorMessage = "El apellido es obligatorio.")]
    [StringLength(100, ErrorMessage = "El apellido no puede superar los 100 caracteres.")]
    string Apellido);
