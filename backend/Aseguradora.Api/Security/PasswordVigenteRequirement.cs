using Microsoft.AspNetCore.Authorization;

namespace Aseguradora.Api.Security;

/// <summary>
/// Requirement added to the policies <see cref="Politicas.Empleado"/> and <see cref="Politicas.Admin"/>:
/// a token marked with <see cref="ClaimsAseguradora.CambiarPassword"/> cannot use the API until the
/// person changes the temporary password (US-F1-09).
/// </summary>
public sealed class PasswordVigenteRequirement : IAuthorizationRequirement
{
    /// <summary>Stable reason code returned in the 403 body (<c>code</c>).</summary>
    public const string Codigo = "PASSWORD_CAMBIO_REQUERIDO";
}

/// <summary>Fails the requirement, with the stable code as reason, when the token is marked.</summary>
public sealed class PasswordVigenteHandler : AuthorizationHandler<PasswordVigenteRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PasswordVigenteRequirement requirement)
    {
        var pendiente = context.User.HasClaim(ClaimsAseguradora.CambiarPassword, "true");
        if (pendiente)
            context.Fail(new AuthorizationFailureReason(this, PasswordVigenteRequirement.Codigo));
        else
            context.Succeed(requirement);

        return Task.CompletedTask;
    }
}
