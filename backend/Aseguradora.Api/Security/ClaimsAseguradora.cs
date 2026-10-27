namespace Aseguradora.Api.Security;

/// <summary>
/// Claim names that cross front boundaries. The API key principal carries
/// <see cref="Proveedor"/> with the name of the configured key (for example <c>pasarela1</c>),
/// so the payment webhook can match it with the provider in the route.
/// </summary>
public static class ClaimsAseguradora
{
    public const string Proveedor = "proveedor";
}
