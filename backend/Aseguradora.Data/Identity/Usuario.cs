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
}
