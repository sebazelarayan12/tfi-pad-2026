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

    /// <summary>True when the password matches the stored hash of <paramref name="usuario"/>.</summary>
    Task<bool> VerificarPasswordAsync(UsuarioCuenta usuario, string password, CancellationToken ct = default);

    /// <summary>Role names assigned to <paramref name="usuario"/>.</summary>
    Task<IReadOnlyList<string>> ObtenerRolesAsync(UsuarioCuenta usuario, CancellationToken ct = default);

    /// <summary>
    /// Creates the account with the given password and assigns it to <paramref name="rol"/>.
    /// Throws <see cref="Exceptions.BusinessRuleException"/> when Identity rejects the data
    /// (for example, a password that does not meet the policy).
    /// </summary>
    Task<UsuarioCuenta> CrearAsync(
        string email,
        string password,
        string rol,
        string nombre,
        string apellido,
        CancellationToken ct = default);

    /// <summary>True when an account with that email already exists.</summary>
    Task<bool> EmailExisteAsync(string email, CancellationToken ct = default);
}
