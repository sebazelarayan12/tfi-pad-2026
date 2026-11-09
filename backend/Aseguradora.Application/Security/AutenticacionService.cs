using Aseguradora.Application.Comun;
using Aseguradora.Application.Exceptions;
using Aseguradora.Application.Security.DTOs;

namespace Aseguradora.Application.Security;

/// <summary>
/// CU01 (login with JWT) and CU03 (create employees and administrators). Both rules live here;
/// Identity persistence stays behind <see cref="IUsuarioStore"/> and token signing behind
/// <see cref="ITokenService"/> (US-F1-03).
/// </summary>
public sealed class AutenticacionService(IUsuarioStore usuarios, ITokenService tokens)
{
    private const string MensajeEmailDuplicado = "El email ya está registrado.";
    private const string MensajePasswordIgual = "La contraseña nueva debe ser distinta de la actual.";

    private readonly IUsuarioStore _usuarios = usuarios ?? throw new ArgumentNullException(nameof(usuarios));
    private readonly ITokenService _tokens = tokens ?? throw new ArgumentNullException(nameof(tokens));

    /// <summary>
    /// Validates the credentials and returns a token with the user's role. An unknown email and
    /// a wrong password fail with the same <see cref="CredencialesInvalidasException"/> and run
    /// the same password hash work, so the response does not reveal which emails exist.
    /// </summary>
    public async Task<LoginResponse> LoginAsync(LoginRequest solicitud, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(solicitud);

        var usuario = await _usuarios.BuscarPorEmailAsync(solicitud.Email, ct);
        // Verify even when the email does not exist: the store checks the password against a
        // dummy hash, so both paths take a similar time (no account enumeration by response time).
        var passwordValida = await _usuarios.VerificarPasswordAsync(usuario, solicitud.Password, ct);
        if (usuario is null || !passwordValida)
            throw new CredencialesInvalidasException();

        var roles = await _usuarios.ObtenerRolesAsync(usuario, ct);
        // An account without a known role cannot pass any policy, so it cannot log in.
        var rol = Roles.Asignables.FirstOrDefault(roles.Contains)
            ?? throw new CredencialesInvalidasException();

        var token = _tokens.CrearToken(usuario, rol);
        return new LoginResponse(token.Token, rol, token.ExpiraEn, usuario.DebeCambiarPassword);
    }

    /// <summary>
    /// Changes the password of the signed-in user and returns a new token without the "must change"
    /// mark (US-F1-09). A wrong current password or a weak new one fail with
    /// <see cref="BusinessRuleException"/> (400, never 401, so the front keeps the session).
    /// </summary>
    public async Task<LoginResponse> CambiarPasswordAsync(
        string usuarioId,
        CambiarPasswordRequest solicitud,
        CancellationToken ct = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(usuarioId);
        ArgumentNullException.ThrowIfNull(solicitud);

        if (string.Equals(solicitud.PasswordActual, solicitud.PasswordNueva, StringComparison.Ordinal))
            throw new BusinessRuleException(MensajePasswordIgual);

        // The account may have been deleted after the token was issued: treat it as a closed session.
        _ = await _usuarios.BuscarPorIdAsync(usuarioId, ct) ?? throw new CredencialesInvalidasException();

        await _usuarios.CambiarPasswordAsync(usuarioId, solicitud.PasswordActual, solicitud.PasswordNueva, ct);

        var actualizado = await _usuarios.BuscarPorIdAsync(usuarioId, ct) ?? throw new CredencialesInvalidasException();
        var roles = await _usuarios.ObtenerRolesAsync(actualizado, ct);
        var rol = Roles.Asignables.FirstOrDefault(roles.Contains) ?? throw new CredencialesInvalidasException();

        var token = _tokens.CrearToken(actualizado, rol);
        return new LoginResponse(token.Token, rol, token.ExpiraEn, actualizado.DebeCambiarPassword);
    }

    /// <summary>
    /// Creates an employee or administrator. Rejects a role other than
    /// <see cref="Roles.Administrador"/> or <see cref="Roles.Empleado"/> and an email that is
    /// already registered (CU03).
    /// </summary>
    public async Task<UsuarioResponse> CrearEmpleadoAsync(CrearUsuarioRequest solicitud, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(solicitud);

        if (!Roles.EsAsignable(solicitud.Rol))
            throw new BusinessRuleException("El rol debe ser Administrador o Empleado.");

        if (await _usuarios.EmailExisteAsync(solicitud.Email, ct))
            throw new BusinessRuleException(MensajeEmailDuplicado);

        var creado = await _usuarios.CrearAsync(
            solicitud.Email,
            solicitud.Password,
            solicitud.Rol,
            solicitud.Nombre,
            solicitud.Apellido,
            debeCambiarPassword: true,
            ct: ct);

        return new UsuarioResponse(creado.Id, creado.Email, solicitud.Rol);
    }

    /// <summary>The account behind a valid token (PB-04), or <see cref="CredencialesInvalidasException"/> when it no longer exists.</summary>
    public async Task<YoResponse> ObtenerYoAsync(string usuarioId, CancellationToken ct = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(usuarioId);

        var cuenta = await _usuarios.BuscarPorIdAsync(usuarioId, ct) ?? throw new CredencialesInvalidasException();
        var roles = await _usuarios.ObtenerRolesAsync(cuenta, ct);
        var rol = Roles.Asignables.FirstOrDefault(roles.Contains) ?? throw new CredencialesInvalidasException();

        return new YoResponse(cuenta.Id, cuenta.Email, cuenta.Nombre, cuenta.Apellido, rol);
    }

    /// <summary>Lists employee and administrator accounts, one page at a time (PB-04).</summary>
    public async Task<PaginaResponse<UsuarioListItemResponse>> ListarUsuariosAsync(
        UsuarioFiltro filtro, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(filtro);

        var pagina = await _usuarios.ListarAsync(filtro.Pagina, filtro.Tamano, ct);
        var items = pagina.Items
            .Select(u => new UsuarioListItemResponse(
                u.Cuenta.Id, u.Cuenta.Email, u.Cuenta.Nombre, u.Cuenta.Apellido, u.Rol, u.Activo, null))
            .ToList();

        return new PaginaResponse<UsuarioListItemResponse>(items, pagina.Pagina, pagina.TamanoPagina, pagina.Total);
    }
}
