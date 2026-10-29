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
        return new LoginResponse(token.Token, rol, token.ExpiraEn);
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
            ct);

        return new UsuarioResponse(creado.Id, creado.Email, solicitud.Rol);
    }
}
