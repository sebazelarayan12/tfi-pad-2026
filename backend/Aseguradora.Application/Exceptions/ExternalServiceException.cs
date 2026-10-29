namespace Aseguradora.Application.Exceptions;

/// <summary>A third-party service failed or answered invalidly (HTTP 502).</summary>
public class ExternalServiceException : Exception
{
    public ExternalServiceException(string message) : base(message)
    {
    }

    public ExternalServiceException(string message, Exception innerException) : base(message, innerException)
    {
    }
}
