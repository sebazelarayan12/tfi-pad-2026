using Aseguradora.Application.Exceptions;
using Aseguradora.Application.Security;

namespace Aseguradora.Tests.Support;

/// <summary>
/// In-memory <see cref="IUsuarioStore"/> for unit and integration tests: no Identity and no
/// database, so the rules of <see cref="AutenticacionService"/> run on their own (C1, US-F1-03).
/// </summary>
public sealed class UsuarioStoreFalso : IUsuarioStore
{
    public const string EmailAdministrador = "admin@example.com";
    public const string PasswordAdministrador = "Admin_Prueba1!";
    public const string EmailEmpleado = "empleado@example.com";
    public const string PasswordEmpleado = "Empleado_Prueba1!";

    private readonly Dictionary<string, Cuenta> _cuentas = new(StringComparer.OrdinalIgnoreCase);
    private readonly List<Creacion> _creaciones = [];
    private int _siguienteId = 1;

    public UsuarioStoreFalso()
    {
        Agregar(EmailAdministrador, Roles.Administrador, PasswordAdministrador);
        Agregar(EmailEmpleado, Roles.Empleado, PasswordEmpleado);
    }

    /// <summary>Data of every successful <see cref="CrearAsync"/> call, in order.</summary>
    public IReadOnlyList<Creacion> Creaciones => _creaciones;

    /// <summary>Id of an account that already exists in the fake store.</summary>
    public string IdDe(string email) => _cuentas[email].Id;

    /// <summary>Seeds an extra account and returns its id.</summary>
    public string Agregar(string email, string rol, string password)
    {
        var id = $"usuario-{_siguienteId++}";
        _cuentas[email] = new Cuenta(id, email, rol, password);
        return id;
    }

    public Task<UsuarioCuenta?> BuscarPorEmailAsync(string email, CancellationToken ct = default) =>
        Task.FromResult(_cuentas.TryGetValue(email, out var cuenta) ? cuenta.ACuenta() : null);

    public Task<bool> VerificarPasswordAsync(
        UsuarioCuenta usuario,
        string password,
        CancellationToken ct = default) =>
        Task.FromResult(_cuentas.Values.Any(cuenta => cuenta.Id == usuario.Id && cuenta.Password == password));

    public Task<IReadOnlyList<string>> ObtenerRolesAsync(
        UsuarioCuenta usuario,
        CancellationToken ct = default)
    {
        var rol = _cuentas.Values.Single(cuenta => cuenta.Id == usuario.Id).Rol;
        return Task.FromResult<IReadOnlyList<string>>([rol]);
    }

    public Task<bool> EmailExisteAsync(string email, CancellationToken ct = default) =>
        Task.FromResult(_cuentas.ContainsKey(email));

    public Task<UsuarioCuenta> CrearAsync(
        string email,
        string password,
        string rol,
        string nombre,
        string apellido,
        CancellationToken ct = default)
    {
        if (_cuentas.ContainsKey(email))
            throw new BusinessRuleException("El email ya está registrado.");

        var cuenta = new Cuenta($"usuario-{_siguienteId++}", email, rol, password);
        _cuentas[email] = cuenta;
        _creaciones.Add(new Creacion(email, password, rol, nombre, apellido));
        return Task.FromResult(cuenta.ACuenta());
    }

    public sealed record Creacion(string Email, string Password, string Rol, string Nombre, string Apellido);

    private sealed record Cuenta(string Id, string Email, string Rol, string Password)
    {
        public UsuarioCuenta ACuenta() => new(Id, Email);
    }
}
