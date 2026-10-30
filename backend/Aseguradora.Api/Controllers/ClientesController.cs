using Aseguradora.Api.Security;
using Aseguradora.Application.Clientes;
using Aseguradora.Application.Clientes.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Aseguradora.Api.Controllers;

/// <summary>
/// Client registration and Renaper validation (CU04, RN01, RN02). Every rule lives in
/// <see cref="ClienteService"/>; the controller only maps requests and responses.
/// Requires employee or administrator permissions (<see cref="Politicas.Empleado"/>).
/// </summary>
[ApiController]
[Route("api/clientes")]
[Authorize(Policy = Politicas.Empleado)]
public sealed class ClientesController(ClienteService clientes) : ControllerBase
{
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
        return Created($"/api/clientes/{creado.Id}", creado);
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
}
