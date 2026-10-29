namespace Aseguradora.Application.External;
/// <summary>Define IPasarelaResolver para la integración de pagos y facturación.</summary>
public interface IPasarelaResolver
{
    /// <summary>Obtiene el proveedor o lanza NotFoundException si no está registrado.</summary>
    IPasarelaService Obtener(string proveedor);
}
