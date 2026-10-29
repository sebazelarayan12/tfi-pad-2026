using Aseguradora.Application.Dtos;
namespace Aseguradora.Application.External;
public interface IPasarelaResolver { IPasarelaService Obtener(string proveedor); }