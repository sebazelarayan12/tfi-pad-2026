namespace Aseguradora.Application.Security;

/// <summary>
/// Identity-independent view of an employee or administrator account (CU01, CU03). It carries
/// only what Application needs (including whether the person still has to change the temporary
/// password, US-F1-09), so no front exposes or depends on the <c>Usuario</c> entity.
/// </summary>
public sealed record UsuarioCuenta(string Id, string Email, bool DebeCambiarPassword = false);
