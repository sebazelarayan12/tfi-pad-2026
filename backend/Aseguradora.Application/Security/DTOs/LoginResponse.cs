namespace Aseguradora.Application.Security.DTOs;

/// <summary>
/// Response of a successful login: the JWT, the role carried by its <c>role</c> claim and the
/// expiry instant in UTC. <see cref="DebeCambiarPassword"/> tells the front to force the password change (US-F1-09).
/// It contains no personal data (US-F1-03).
/// </summary>
public sealed record LoginResponse(
    string Token,
    string Rol,
    DateTimeOffset ExpiraEn,
    bool DebeCambiarPassword = false);
