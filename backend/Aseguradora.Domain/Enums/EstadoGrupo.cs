namespace Aseguradora.Domain.Enums;

/// <summary>
/// State of the access request of an external group. Only an <see cref="Aprobada"/> group can hold
/// an active API key.
/// </summary>
public enum EstadoGrupo
{
    Pendiente = 0,
    Aprobada = 1,
    Rechazada = 2,
    Revocada = 3
}
