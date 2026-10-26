namespace Aseguradora.Application.Exceptions;

/// <summary>A third-party service failed or answered invalidly (HTTP 502).</summary>
public class ExternalServiceException(string message) : Exception(message);
