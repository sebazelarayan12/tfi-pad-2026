using System.ComponentModel.DataAnnotations;

namespace Aseguradora.Application.Security.DTOs;

/// <summary>Body of <c>PUT /api/usuarios/{id}</c> (PB-04). The email and the password do not change here.</summary>
public sealed record ActualizarUsuarioRequest(
    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [StringLength(100, ErrorMessage = "El nombre no puede superar los 100 caracteres.")]
    string Nombre,
    [Required(ErrorMessage = "El apellido es obligatorio.")]
    [StringLength(100, ErrorMessage = "El apellido no puede superar los 100 caracteres.")]
    string Apellido,
    [Required(ErrorMessage = "El rol es obligatorio.")]
    [AllowedValues(Roles.Administrador, Roles.Empleado,
        ErrorMessage = "El rol debe ser Administrador o Empleado.")]
    string Rol);
