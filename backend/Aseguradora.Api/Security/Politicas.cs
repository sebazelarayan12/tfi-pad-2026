namespace Aseguradora.Api.Security;

/// <summary>
/// Authorization policy names (C10). Every front uses these constants with
/// <c>[Authorize(Policy = ...)]</c>; no front defines another name.
/// </summary>
public static class Politicas
{
    /// <summary>Role Empleado or Administrador, validated with a JWT (scheme Bearer).</summary>
    public const string Empleado = "Empleado";

    /// <summary>Role Administrador, validated with a JWT (scheme Bearer).</summary>
    public const string Admin = "Admin";

    /// <summary>Valid API key principal, validated with the scheme ApiKey (header X-Api-Key).</summary>
    public const string ApiKey = "ApiKey";
}
