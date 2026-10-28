namespace Aseguradora.Domain.Exceptions;

/// <summary>A state change that the policy or installment state machine does not allow (HTTP 400).</summary>
public class TransicionInvalidaException(string message) : ReglaDeDominioException(message);
