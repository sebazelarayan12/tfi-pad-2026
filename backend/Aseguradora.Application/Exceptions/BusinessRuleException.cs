namespace Aseguradora.Application.Exceptions;
/// <summary>A business rule was violated (HTTP 400).</summary>
public class BusinessRuleException : Exception
{
    /// <summary>Creates a business rule failure.</summary>
    public BusinessRuleException(string message) : base(message) { }
    /// <summary>Preserves the technical cause for diagnostics.</summary>
    public BusinessRuleException(string message, Exception innerException) : base(message, innerException) { }
}
