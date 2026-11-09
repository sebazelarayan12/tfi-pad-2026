namespace Aseguradora.Application.Security;

/// <summary>An account with its role and whether it can sign in, as the store lists it (PB-04).</summary>
public sealed record UsuarioListado(UsuarioCuenta Cuenta, string Rol, bool Activo);
