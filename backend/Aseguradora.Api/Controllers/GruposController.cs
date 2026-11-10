using System.Security.Claims;
using Aseguradora.Api.Security;
using Aseguradora.Application.Comun;
using Aseguradora.Application.Grupos;
using Aseguradora.Application.Security.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Aseguradora.Api.Controllers;

/// <summary>
/// Self-service access for external groups: registration and sign-in (public, rate limited like the rest
/// of <c>/api/publico</c>), the group's own panel (role Grupo) and the administrator's review of requests.
/// Every rule lives in <see cref="GrupoExternoService"/>.
/// </summary>
[ApiController]
public sealed class GruposController(GrupoExternoService grupos) : ControllerBase
{
    /// <summary>Creates the account and a pending access request.</summary>
    [HttpPost("api/publico/grupos/registro")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(GrupoCuentaResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<GrupoCuentaResponse>> Registrar(RegistroGrupoRequest solicitud, CancellationToken ct) =>
        StatusCode(StatusCodes.Status201Created, await grupos.RegistrarAsync(solicitud, ct));

    /// <summary>Signs a group in. The token only opens the group's own panel.</summary>
    [HttpPost("api/publico/grupos/login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<LoginResponse>> Login(LoginRequest solicitud, CancellationToken ct) =>
        Ok(await grupos.LoginAsync(solicitud, ct));

    /// <summary>The signed-in group: request state and key summary.</summary>
    [HttpGet("api/grupos/mi-cuenta")]
    [Authorize(Policy = Politicas.Grupo)]
    [ProducesResponseType(typeof(GrupoCuentaResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<GrupoCuentaResponse>> MiCuenta(CancellationToken ct) =>
        IdDelToken() is { } id ? Ok(await grupos.ObtenerCuentaAsync(id, ct)) : Unauthorized();

    /// <summary>Generates a new API key. The previous one stops working. The key is shown only in this response.</summary>
    [HttpPost("api/grupos/mi-cuenta/clave")]
    [Authorize(Policy = Politicas.Grupo)]
    [ProducesResponseType(typeof(ClaveGeneradaResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ClaveGeneradaResponse>> GenerarClave(CancellationToken ct) =>
        IdDelToken() is { } id
            ? StatusCode(StatusCodes.Status201Created, await grupos.GenerarClaveAsync(id, ct))
            : Unauthorized();

    /// <summary>Lists the groups, newest request first. Only an administrator can call it.</summary>
    [HttpGet("api/grupos")]
    [Authorize(Policy = Politicas.Admin)]
    [ProducesResponseType(typeof(PaginaResponse<GrupoListItemResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public Task<PaginaResponse<GrupoListItemResponse>> Listar([FromQuery] GrupoFiltro filtro, CancellationToken ct) =>
        grupos.ListarAsync(filtro.Estado, filtro.Pagina, filtro.Tamano, ct);

    /// <summary>Approves a request. The group can then generate its key.</summary>
    [HttpPost("api/grupos/{id:guid}/aprobar")]
    [Authorize(Policy = Politicas.Admin)]
    [ProducesResponseType(typeof(GrupoListItemResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<GrupoListItemResponse>> Aprobar(Guid id, CancellationToken ct) =>
        Ok(await grupos.AprobarAsync(id, ct));

    /// <summary>Rejects a pending request with a reason the group can read.</summary>
    [HttpPost("api/grupos/{id:guid}/rechazar")]
    [Authorize(Policy = Politicas.Admin)]
    [ProducesResponseType(typeof(GrupoListItemResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<GrupoListItemResponse>> Rechazar(Guid id, MotivoRequest solicitud, CancellationToken ct) =>
        Ok(await grupos.RechazarAsync(id, solicitud, ct));

    /// <summary>Withdraws the access of an approved group: its key stops working at once.</summary>
    [HttpPost("api/grupos/{id:guid}/revocar")]
    [Authorize(Policy = Politicas.Admin)]
    [ProducesResponseType(typeof(GrupoListItemResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<GrupoListItemResponse>> Revocar(Guid id, MotivoRequest solicitud, CancellationToken ct) =>
        Ok(await grupos.RevocarAsync(id, solicitud, ct));

    private Guid? IdDelToken()
    {
        var valor = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        return Guid.TryParse(valor, out var id) ? id : null;
    }
}
