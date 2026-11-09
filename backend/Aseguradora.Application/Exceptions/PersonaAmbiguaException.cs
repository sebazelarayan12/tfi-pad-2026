namespace Aseguradora.Application.Exceptions;

/// <summary>
/// Renaper found several people for the same DNI (it can belong to a man and a woman) and asks for the
/// CUIL instead. It is an <see cref="ExternalServiceException"/> on purpose: callers that cannot retry by
/// CUIL treat it like any other "could not validate" outcome.
/// </summary>
public sealed class PersonaAmbiguaException(string message) : ExternalServiceException(message);
