namespace Aseguradora.Application.Clientes.DTOs;

/// <summary>
/// One row of the client list (CU05). It carries only the fields the employee needs to choose a
/// client; <see cref="ClienteResponse"/> is returned by the detail endpoint.
/// </summary>
/// <param name="Id">Unique identifier of the client.</param>
/// <param name="Dni">Document number.</param>
/// <param name="Nombre">First name.</param>
/// <param name="Apellido">Last name.</param>
/// <param name="Email">Unique email of the client (RN01).</param>
/// <param name="Telefono">Contact phone, when present.</param>
/// <param name="Activo">Whether the client is active (RN15).</param>
public sealed record ClienteResumenResponse(
    Guid Id,
    string Dni,
    string Nombre,
    string Apellido,
    string Email,
    string? Telefono,
    bool Activo);
