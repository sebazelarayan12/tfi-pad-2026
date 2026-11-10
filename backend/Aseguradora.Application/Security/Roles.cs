namespace Aseguradora.Application.Security;

/// <summary>
/// Canonical role names (C10). Every front uses these constants instead of loose strings.
/// </summary>
public static class Roles
{
    public const string Administrador = "Administrador";
    public const string Empleado = "Empleado";

    /// <summary>
    /// External group that wants to consume the API. It is not assignable by an administrator and
    /// no employee policy accepts it: it only reaches the endpoints of its own integration panel.
    /// </summary>
    public const string Grupo = "Grupo";

    /// <summary>
    /// Roles an administrator can assign through CU03, most privileged first. Login uses the
    /// same order to pick one role when an account has more than one (US-F1-03).
    /// </summary>
    public static IReadOnlyList<string> Asignables { get; } = [Administrador, Empleado];

    /// <summary>True when <paramref name="rol"/> is one of <see cref="Asignables"/>.</summary>
    public static bool EsAsignable(string? rol) => rol is not null && Asignables.Contains(rol);
}
