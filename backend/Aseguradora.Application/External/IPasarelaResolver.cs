namespace Aseguradora.Application.External;
/// <summary>Obtiene el servicio de pasarela de pagos correspondiente a un proveedor.</summary>
public interface IPasarelaResolver
{
    /// <summary>Obtiene el proveedor o lanza NotFoundException si no está registrado.</summary>
    IPasarelaService Obtener(string proveedor);
}
