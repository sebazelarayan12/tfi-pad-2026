namespace Aseguradora.Application.Exceptions;

/// <summary>The requested resource does not exist (HTTP 404).</summary>
public class NotFoundException(string message) : Exception(message);
