namespace Aseguradora.Application.Exceptions;

/// <summary>
/// Login failed (HTTP 401). The message is the same for an unknown email and a wrong password,
/// so the response never reveals which accounts exist (CU01, US-F1-03).
/// </summary>
public sealed class CredencialesInvalidasException() : Exception(Mensaje)
{
    public const string Mensaje = "Credenciales inválidas.";
}
