using Aseguradora.Api.Security;
using Aseguradora.Application.Security;
using Aseguradora.Application.Security.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Aseguradora.Api.Controllers;

/// <summary>
/// CU01 (login with JWT) and CU03 (create employees and administrators). Every rule lives in
/// <see cref="AutenticacionService"/>; the controller only maps requests and responses.
/// </summary>
[ApiController]
[Route("api/auth")]
public sealed class AuthController(AutenticacionService autenticacion) : ControllerBase
{
    private readonly AutenticacionService _autenticacion =
        autenticacion ?? throw new ArgumentNullException(nameof(autenticacion));

    /// <summary>Validates credentials and returns the JWT, the role and the expiry.</summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<LoginResponse>> Login(LoginRequest solicitud, CancellationToken ct) =>
        Ok(await _autenticacion.LoginAsync(solicitud, ct));

    /// <summary>
    /// Changes the temporary password (US-F1-09). It accepts a token marked "must change" and returns a
    /// new token without the mark. A wrong current password answers 400, not 401.
    /// </summary>
    [HttpPost("cambiar-password")]
    [Authorize(Policy = Politicas.CambioPassword)]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<LoginResponse>> CambiarPassword(
        CambiarPasswordRequest solicitud,
        CancellationToken ct)
    {
        var usuarioId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;
        if (string.IsNullOrWhiteSpace(usuarioId))
            return Unauthorized();

        return Ok(await _autenticacion.CambiarPasswordAsync(usuarioId, solicitud, ct));
    }

    /// <summary>Creates an employee or administrator. Only an administrator can call it.</summary>
    [HttpPost("usuarios")]
    [Authorize(Policy = Politicas.Admin)]
    [ProducesResponseType(typeof(UsuarioResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<UsuarioResponse>> CrearUsuario(
        CrearUsuarioRequest solicitud,
        CancellationToken ct)
    {
        var usuario = await _autenticacion.CrearEmpleadoAsync(solicitud, ct);
        return StatusCode(StatusCodes.Status201Created, usuario);
    }
}
