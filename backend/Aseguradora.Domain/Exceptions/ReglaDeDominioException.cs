namespace Aseguradora.Domain.Exceptions;

/// <summary>A domain rule was not met: invalid term, non-positive premium, missing cancellation reason (HTTP 400).</summary>
public class ReglaDeDominioException(string message) : Exception(message);
