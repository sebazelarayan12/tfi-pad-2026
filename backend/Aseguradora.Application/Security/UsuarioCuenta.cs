namespace Aseguradora.Application.Security;

/// <summary>
/// Identity-independent view of an employee or administrator account (CU01, CU03). It carries
/// only what Application needs, so no front exposes or depends on the <c>Usuario</c> entity.
/// </summary>
public sealed record UsuarioCuenta(string Id, string Email);
