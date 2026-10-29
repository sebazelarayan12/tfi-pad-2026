using Aseguradora.Application.External;
using Aseguradora.Application.Exceptions;
namespace Aseguradora.Integrations.Pasarela;
/// <summary>Define PasarelaResolver para la integración de pagos y facturación.</summary>
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
