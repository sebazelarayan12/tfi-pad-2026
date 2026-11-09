namespace Aseguradora.Application.Security;

/// <summary>
/// Persistence contract for employee and administrator accounts (CU01, CU03). The Identity
/// implementation lives in Data, so the rules of <see cref="AutenticacionService"/> stay in
/// Application and the tests can use a fake store.
/// </summary>
public interface IUsuarioStore
{
    /// <summary>Returns the account with that email, or <c>null</c> when it does not exist.</summary>
    Task<UsuarioCuenta?> BuscarPorEmailAsync(string email, CancellationToken ct = default);

    /// <summary>
    /// True when the password matches the stored hash of <paramref name="usuario"/>. When
    /// <paramref name="usuario"/> is <c>null</c> it still runs a password hash check against a
    /// dummy hash and returns false, so an unknown email does not answer faster than a wrong
    /// password (account enumeration by response time).
    /// </summary>
    Task<bool> VerificarPasswordAsync(UsuarioCuenta? usuario, string password, CancellationToken ct = default);

    /// <summary>Role names assigned to <paramref name="usuario"/>.</summary>
    Task<IReadOnlyList<string>> ObtenerRolesAsync(UsuarioCuenta usuario, CancellationToken ct = default);

    /// <summary>
    /// Creates the account with the given password and assigns it to <paramref name="rol"/>. When
    /// <paramref name="debeCambiarPassword"/> is true the password is temporary (US-F1-09).
    /// Throws <see cref="Exceptions.BusinessRuleException"/> when Identity rejects the data
    /// (for example, a password that does not meet the policy).
    /// </summary>
    Task<UsuarioCuenta> CrearAsync(
        string email,
        string password,
        string rol,
        string nombre,
        string apellido,
        bool debeCambiarPassword = false,
        CancellationToken ct = default);

    /// <summary>Returns the account with that id, or <c>null</c> when it does not exist.</summary>
    Task<UsuarioCuenta?> BuscarPorIdAsync(string id, CancellationToken ct = default);

    /// <summary>
    /// Changes the password and clears the "must change" flag (US-F1-09). Throws
    /// <see cref="Exceptions.BusinessRuleException"/> when the current password is wrong or the new one
    /// does not meet the policy; the message is the Identity text in Spanish.
    /// </summary>
    Task CambiarPasswordAsync(
        string id,
        string passwordActual,
        string passwordNueva,
        CancellationToken ct = default);

    /// <summary>Lists accounts ordered by email, one page at a time (PB-04).</summary>
    Task<Comun.PaginaResponse<UsuarioListado>> ListarAsync(int pagina, int tamano, CancellationToken ct = default);

    /// <summary>The account with its role and state, or <c>null</c> when the id does not exist (PB-04).</summary>
    Task<UsuarioListado?> BuscarListadoAsync(string id, CancellationToken ct = default);

    /// <summary>
    /// Changes name, surname and role. The role is replaced, never added. Throws
    /// <see cref="Exceptions.BusinessRuleException"/> when Identity rejects the change (PB-04).
    /// </summary>
    Task ActualizarAsync(string id, string nombre, string apellido, string rol, CancellationToken ct = default);

    /// <summary>
    /// Enables or disables sign-in for the account (a disabled account is locked out). Existing
    /// data is kept (PB-04).
    /// </summary>
    Task EstablecerActivoAsync(string id, bool activo, CancellationToken ct = default);

    /// <summary>Number of active accounts with the administrator role.</summary>
    Task<int> ContarAdministradoresActivosAsync(CancellationToken ct = default);

    /// <summary>True when an account with that email already exists.</summary>
    Task<bool> EmailExisteAsync(string email, CancellationToken ct = default);
}
