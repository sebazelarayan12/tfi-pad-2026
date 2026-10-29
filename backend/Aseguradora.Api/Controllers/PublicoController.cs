using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Aseguradora.Api.Controllers;

/// <summary>
/// Base class of the anonymous public web endpoints (CU02, CU15, CU18, CU20). It has no
/// <c>[EnableRateLimiting]</c> on purpose: RN20 is applied to the whole <c>/api/publico/*</c> prefix
/// by the global limiter of <see cref="Security.PublicoRateLimitExtensions"/> (C15).
/// </summary>
[ApiController]
[AllowAnonymous]
[Route("api/publico")]
public class PublicoController : ControllerBase
{
}
