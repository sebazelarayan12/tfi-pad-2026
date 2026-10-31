namespace Aseguradora.Application.Exceptions;

/// <summary>Indica una indisponibilidad temporal que admite reintentos.</summary>
public sealed class ServicioNoDisponibleException(string message) : Exception(message)
{
    public const int ReintentarEnSegundos = 15;
}
