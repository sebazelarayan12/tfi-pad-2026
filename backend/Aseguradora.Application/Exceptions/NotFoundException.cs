namespace Aseguradora.Application.Exceptions;

/// <summary>
/// The requested resource does not exist (HTTP 404). The optional <see cref="Codigo"/> is a stable,
/// machine-readable reason that the exception middleware exposes as the <c>codigo</c> ProblemDetails extension.
/// </summary>
public class NotFoundException(string message) : Exception(message)
{
    /// <summary>Creates a 404 with a stable reason code for external clients.</summary>
    public NotFoundException(string message, string codigo) : this(message)
    {
        Codigo = codigo;
    }

    /// <summary>Stable reason code (for example <c>CLIENTE_NO_ENCONTRADO</c>), or null when none applies.</summary>
    public string? Codigo { get; }
}
