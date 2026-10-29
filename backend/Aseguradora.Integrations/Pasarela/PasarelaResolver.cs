using Aseguradora.Application.External;
using Aseguradora.Application.Exceptions;
namespace Aseguradora.Integrations.Pasarela;
/// <summary>Resuelve el servicio de pasarela de pagos a partir del nombre del proveedor.</summary>
public sealed class PasarelaResolver : IPasarelaResolver
{
    private readonly IReadOnlyDictionary<string, IPasarelaService> proveedores;

    /// <summary>Crea el resolver con las instancias de cada proveedor.</summary>
    public PasarelaResolver(IReadOnlyDictionary<string, IPasarelaService> proveedores)
    {
        ArgumentNullException.ThrowIfNull(proveedores);
        this.proveedores = proveedores;
    }

    /// <summary>Obtiene el proveedor o lanza NotFoundException si no está registrado.</summary>
    public IPasarelaService Obtener(string proveedor) => proveedores.TryGetValue(proveedor, out var servicio)
        ? servicio : throw new NotFoundException($"Proveedor desconocido: {proveedor}.");
}
