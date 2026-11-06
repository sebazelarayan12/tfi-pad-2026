using Microsoft.AspNetCore.Identity;

namespace Aseguradora.Data.Identity;

/// <summary>
/// Employee or administrator account (CU01, CU03). The email is also the user name, so both
/// login and uniqueness use the same value (US-F1-02).
/// </summary>
public sealed class Usuario : IdentityUser
{
    public const int LongitudMaximaNombre = 100;

    public string Nombre { get; set; } = string.Empty;

    public string Apellido { get; set; } = string.Empty;

    /// <summary>
    /// True while the account still uses the temporary password an administrator set (US-F1-09).
    /// Existing accounts and the initial administrator are <c>false</c>.
    /// </summary>
    public bool DebeCambiarPassword { get; set; }
}
