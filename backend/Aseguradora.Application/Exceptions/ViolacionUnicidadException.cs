namespace Aseguradora.Application.Exceptions;

/// <summary>
/// Saving broke a unique index: another request saved the same data first. The data layer raises it
/// so services can turn it into a business message without depending on EF Core.
/// </summary>
public sealed class ViolacionUnicidadException(string message, Exception innerException)
    : Exception(message, innerException);
