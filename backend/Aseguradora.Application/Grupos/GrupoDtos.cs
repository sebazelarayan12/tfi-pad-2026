using System.ComponentModel.DataAnnotations;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;

namespace Aseguradora.Application.Grupos;

/// <summary>Body of <c>POST /api/publico/grupos/registro</c>: the account and the access request.</summary>
public sealed record RegistroGrupoRequest(
    [Required(ErrorMessage = "El email es obligatorio.")]
    [EmailAddress(ErrorMessage = "El email no tiene un formato válido.")]
    [StringLength(256, ErrorMessage = "El email no puede superar los 256 caracteres.")]
    string Email,
    [Required(ErrorMessage = "La contraseña es obligatoria.")]
    [StringLength(128, ErrorMessage = "La contraseña no puede superar los 128 caracteres.")]
    string Password,
    [Required(ErrorMessage = "El nombre del grupo es obligatorio.")]
    [StringLength(GrupoExterno.LongitudMaximaNombre, ErrorMessage = "El nombre del grupo no puede superar los 100 caracteres.")]
    string Nombre,
    [Required(ErrorMessage = "El contacto es obligatorio.")]
    [StringLength(GrupoExterno.LongitudMaximaContacto, ErrorMessage = "El contacto no puede superar los 100 caracteres.")]
    string Contacto,
    [Required(ErrorMessage = "Contá para qué vas a usar la API.")]
    [StringLength(GrupoExterno.LongitudMaximaDescripcion, ErrorMessage = "La descripción no puede superar los 500 caracteres.")]
    string Descripcion);

/// <summary>Body of the reject and revoke endpoints.</summary>
public sealed record MotivoRequest(
    [Required(ErrorMessage = "El motivo es obligatorio.")]
    [StringLength(GrupoExterno.LongitudMaximaMotivo, ErrorMessage = "El motivo no puede superar los 300 caracteres.")]
    string Motivo);

/// <summary>The account and request state a group sees in its own panel.</summary>
public sealed record GrupoCuentaResponse(
    Guid Id,
    string Nombre,
    string Email,
    string Contacto,
    string Descripcion,
    EstadoGrupo Estado,
    string? Motivo,
    DateTime FechaSolicitud,
    DateTime? FechaResolucion,
    bool TieneClave,
    string? ClavePrefijo,
    DateTime? ClaveCreadaEn);

/// <summary>A group in the administrator's list.</summary>
public sealed record GrupoListItemResponse(
    Guid Id,
    string Nombre,
    string Email,
    string Contacto,
    string Descripcion,
    EstadoGrupo Estado,
    string? Motivo,
    DateTime FechaSolicitud,
    DateTime? FechaResolucion,
    bool TieneClave);

/// <summary>Query of <c>GET /api/grupos</c>.</summary>
public sealed record GrupoFiltro
{
    public EstadoGrupo? Estado { get; init; }

    [Range(1, int.MaxValue, ErrorMessage = "La página debe ser 1 o mayor.")]
    public int Pagina { get; init; } = 1;

    [Range(1, 100, ErrorMessage = "El tamaño de página debe estar entre 1 y 100.")]
    public int Tamano { get; init; } = 20;
}

/// <summary>The new key. It is shown only in this response: the server keeps just its hash.</summary>
public sealed record ClaveGeneradaResponse(string Clave, string Prefijo, DateTime CreadaEn);

/// <summary>The group an API key belongs to.</summary>
public sealed record GrupoAutenticado(Guid Id, string Nombre);
