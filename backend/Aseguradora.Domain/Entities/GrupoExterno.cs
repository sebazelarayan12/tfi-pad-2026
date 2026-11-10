using Aseguradora.Domain.Enums;

namespace Aseguradora.Domain.Entities;

/// <summary>
/// An external group (company or team) that asks to consume the public API. It has its own account
/// (email and password), a request that an administrator resolves, and at most one active API key.
/// The key is stored hashed: the plain value is shown once, when it is generated.
/// </summary>
public class GrupoExterno : EntityBase
{
    public const int LongitudMaximaNombre = 100;
    public const int LongitudMaximaContacto = 100;
    public const int LongitudMaximaDescripcion = 500;
    public const int LongitudMaximaMotivo = 300;

    /// <summary>Public name of the group. Unique, case-insensitive.</summary>
    public string Nombre { get; set; } = string.Empty;

    /// <summary>Login email, stored lowercase. Unique.</summary>
    public string Email { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    /// <summary>Person to contact about the request.</summary>
    public string Contacto { get; set; } = string.Empty;

    /// <summary>What the group wants the API for.</summary>
    public string Descripcion { get; set; } = string.Empty;

    public EstadoGrupo Estado { get; set; } = EstadoGrupo.Pendiente;

    /// <summary>Why the request was rejected or the access revoked.</summary>
    public string? Motivo { get; set; }

    public DateTime FechaSolicitud { get; set; }

    public DateTime? FechaResolucion { get; set; }

    /// <summary>SHA-256 of the active key in hexadecimal, or null when the group has none.</summary>
    public string? ClaveHash { get; set; }

    /// <summary>First characters of the key, so the group can tell which key it holds.</summary>
    public string? ClavePrefijo { get; set; }

    public DateTime? ClaveCreadaEn { get; set; }
}
