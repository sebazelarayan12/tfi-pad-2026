using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Aseguradora.Tests.Support;

/// <summary>
/// Test-only public endpoints for RN20 (US-F1-07). They carry no rate limit attribute on purpose:
/// the global limiter must cover the whole <c>/api/publico/*</c> prefix (C15). The shared factory
/// registers the test assembly's controllers, so these routes exist only in tests.
/// </summary>
[ApiController]
[AllowAnonymous]
[Route("api/publico")]
public sealed class ProbeLimiteController : ControllerBase
{
    [HttpGet("prueba-limite")]
    public IActionResult Prueba() => Ok(new { ruta = "prueba-limite" });

    [HttpGet("prueba-limite-2")]
    public IActionResult Prueba2() => Ok(new { ruta = "prueba-limite-2" });
}

/// <summary>A test-only route outside <c>/api/publico</c>: the public limiter must not touch it.</summary>
[ApiController]
[AllowAnonymous]
[Route("api/probe-limite")]
public sealed class ProbeFueraLimiteController : ControllerBase
{
    [HttpGet]
    public IActionResult Prueba() => Ok(new { ruta = "fuera-del-prefijo" });
}
