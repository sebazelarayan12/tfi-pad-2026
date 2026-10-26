using Aseguradora.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Aseguradora.Tests.Support;

/// <summary>
/// Test-only endpoints, one per policy (C16). The temporary factory registers them with
/// <c>AddApplicationPart</c>; they never ship in the API.
/// </summary>
[ApiController]
[Route("api/probe")]
public sealed class ProbeController : ControllerBase
{
    [HttpGet("empleado")]
    [Authorize(Policy = Politicas.Empleado)]
    public IActionResult Empleado() => Ok(new { politica = Politicas.Empleado });

    [HttpGet("admin")]
    [Authorize(Policy = Politicas.Admin)]
    public IActionResult Admin() => Ok(new { politica = Politicas.Admin });

    [HttpGet("apikey")]
    [Authorize(Policy = Politicas.ApiKey)]
    public IActionResult ApiKey() =>
        Ok(new { proveedor = User.FindFirst(ClaimsAseguradora.Proveedor)?.Value });
}
