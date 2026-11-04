using Aseguradora.Api.Security;
using Aseguradora.Application.Clientes;
using Aseguradora.Application.Clientes.DTOs;
using Aseguradora.Application.Comun;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Aseguradora.Api.Controllers;

/// <summary>
/// Client registration, Renaper validation, query, modification and soft deletion (CU04, CU05, RN01, RN02, RN15). Every rule lives in
/// <see cref="ClienteService"/>; the controller only maps requests and responses.
/// Requires employee or administrator permissions (<see cref="Politicas.Empleado"/>).
/// </summary>
[ApiController]
[Route(RutaBase)]
[Authorize(Policy = Politicas.Empleado)]
public sealed class ClientesController(ClienteService clientes) : ControllerBase
{
    private const string RutaBase = "api/clientes";

    private readonly ClienteService _clientes = clientes ?? throw new ArgumentNullException(nameof(clientes));

    /// <summary>
    /// Registers a client after validating the person in Renaper and overwriting the typed data
    /// with the official one (CU04, RN02).
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ClienteResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ClienteResponse>> Alta(ClienteAltaRequest request, CancellationToken ct)
    {
        var creado = await _clientes.AltaAsync(request, ct);
        return CreatedAtAction(nameof(Obtener), new { id = creado.Id }, creado);
    }

    /// <summary>
    /// Retries the Renaper validation of an existing client, for example after an outage (CU04).
    /// </summary>
    [HttpPost("{id:guid}/validar-renaper")]
    [ProducesResponseType(typeof(ClienteResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status502BadGateway)]
    public async Task<ActionResult<ClienteResponse>> ValidarRenaper(Guid id, CancellationToken ct) =>
        Ok(await _clientes.ValidarRenaperAsync(id, ct));

    /// <summary>
    /// Returns what Renaper knows about a DNI so the employee can pre-load the form (CU04).
    /// </summary>
    [HttpGet("renaper/{dni}")]
    [ProducesResponseType(typeof(PersonaRenaperResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status502BadGateway)]
    public async Task<ActionResult<PersonaRenaperResponse>> PreviewRenaper(string dni, CancellationToken ct) =>
        Ok(await _clientes.PreviewRenaperAsync(dni, ct));

    /// <summary>
    /// Lists active clients with the optional <c>dni</c> (exact) and <c>apellido</c> (partial,
    /// case-insensitive) filters, one page at a time (CU05).
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PaginaResponse<ClienteResumenResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<PaginaResponse<ClienteResumenResponse>>> Listar(
        [FromQuery] ClienteFiltro filtro, CancellationToken ct) =>
        Ok(await _clientes.ListarAsync(filtro, ct));

    /// <summary>Gets the detail of an active client (CU05). A deactivated client responds 404.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ClienteResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ClienteResponse>> Obtener(Guid id, CancellationToken ct) =>
        Ok(await _clientes.ObtenerAsync(id, ct));

    /// <summary>
    /// Changes the contact data and address of an active client (CU05). DNI and name are not part
    /// of the request, so they cannot be changed from here.
    /// </summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ClienteResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ClienteResponse>> Modificar(
        Guid id, ClienteModificacionRequest request, CancellationToken ct) =>
        Ok(await _clientes.ModificarAsync(id, request, ct));

    /// <summary>
    /// Soft-deletes an active client (RN15). Rejected with 400 when it has a Pendiente, Vigente or
    /// Suspendida policy.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DarDeBaja(Guid id, CancellationToken ct)
    {
        await _clientes.DarDeBajaAsync(id, ct);
        return NoContent();
    }
}
