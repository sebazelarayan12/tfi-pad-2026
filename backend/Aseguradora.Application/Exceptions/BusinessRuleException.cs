namespace Aseguradora.Application.Exceptions;

/// <summary>A business rule was violated (HTTP 400).</summary>
public class BusinessRuleException(string message) : Exception(message);
