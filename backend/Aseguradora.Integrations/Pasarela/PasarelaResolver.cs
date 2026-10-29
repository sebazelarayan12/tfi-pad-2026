using Aseguradora.Application.External;
using Aseguradora.Application.Exceptions;
namespace Aseguradora.Integrations.Pasarela;
public sealed class PasarelaResolver(IReadOnlyDictionary<string, IPasarelaService> proveedores) : IPasarelaResolver
{
    public IPasarelaService Obtener(string proveedor) => proveedores.TryGetValue(proveedor, out var servicio)
        ? servicio : throw new NotFoundException($"Proveedor desconocido: {proveedor}.");
}