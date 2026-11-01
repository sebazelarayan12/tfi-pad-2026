using Aseguradora.Application.Clientes.DTOs;
using Aseguradora.Application.Comun;
using Aseguradora.Application.Exceptions;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Domain.Interfaces;

namespace Aseguradora.Application.Clientes;

/// <summary>
/// Query, modification and soft deletion of clients (CU05, RN01, RN15). Every rule lives here;
/// the controller only maps HTTP.
/// </summary>
public sealed class ClienteService(
    IRepository<Cliente> clientes,
    IRepository<Poliza> polizas,
    IUnitOfWork unitOfWork)
{
    /// <summary>Stable reason code returned when the requested client does not exist.</summary>
    public const string CodigoClienteNoEncontrado = "CLIENTE_NO_ENCONTRADO";

    private readonly IRepository<Cliente> _clientes = clientes ?? throw new ArgumentNullException(nameof(clientes));
    private readonly IRepository<Poliza> _polizas = polizas ?? throw new ArgumentNullException(nameof(polizas));
    private readonly IUnitOfWork _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));

    /// <summary>
    /// Lists active clients filtered by DNI (exact) and last name (partial, case-insensitive).
    /// Filtering, ordering, paging and counting run in the database; only one page is loaded.
    /// </summary>
    /// <param name="filtro">Optional filters and page requested by the employee.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>One page of clients and the total number of matches.</returns>
    public Task<PaginaResponse<ClienteResumenResponse>> ListarAsync(
        ClienteFiltro filtro,
        CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(filtro);
        ct.ThrowIfCancellationRequested();

        var consulta = _clientes.Query().Where(c => c.Activo);

        if (!string.IsNullOrWhiteSpace(filtro.Dni))
        {
            var dni = filtro.Dni.Trim();
            consulta = consulta.Where(c => c.Dni == dni);
        }

        if (!string.IsNullOrWhiteSpace(filtro.Apellido))
        {
            var apellido = filtro.Apellido.Trim().ToLowerInvariant();
            consulta = consulta.Where(c => c.Apellido.ToLower().Contains(apellido));
        }

        var total = consulta.Count();
        var items = consulta
            .OrderBy(c => c.Apellido)
            .ThenBy(c => c.Nombre)
            .ThenBy(c => c.Dni)
            .Skip((filtro.Pagina - 1) * filtro.TamanoPagina)
            .Take(filtro.TamanoPagina)
            .Select(c => new ClienteResumenResponse(
                c.Id, c.Dni, c.Nombre, c.Apellido, c.Email, c.Telefono, c.Activo))
            .ToList();

        return Task.FromResult(new PaginaResponse<ClienteResumenResponse>(
            items, filtro.Pagina, filtro.TamanoPagina, total));
    }

    /// <summary>Returns the detail of an active client (CU05).</summary>
    /// <param name="id">Identifier of the client.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>The client with every field.</returns>
    /// <exception cref="NotFoundException">Thrown when the client does not exist or is deactivated.</exception>
    public async Task<ClienteResponse> ObtenerAsync(Guid id, CancellationToken ct = default)
    {
        var cliente = await BuscarActivoAsync(id, ct);
        return Mapear(cliente);
    }

    /// <summary>
    /// Changes the contact data and address of an active client (CU05). DNI, name and the data
    /// validated with Renaper are never touched, and the new email must be free (RN01).
    /// </summary>
    /// <param name="id">Identifier of the client.</param>
    /// <param name="request">New contact data and address.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>The updated client.</returns>
    /// <exception cref="NotFoundException">Thrown when the client does not exist or is deactivated.</exception>
    /// <exception cref="BusinessRuleException">Thrown when another client already uses the email (RN01).</exception>
    public async Task<ClienteResponse> ModificarAsync(
        Guid id,
        ClienteModificacionRequest request,
        CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var cliente = await BuscarActivoAsync(id, ct);
        var email = request.Email.Trim();

        // The client's own email is not a conflict: RN01 only forbids sharing it with another client.
        var emailEnUso = await _clientes.AnyAsync(
            c => c.Id != id && c.Email.ToLower() == email.ToLowerInvariant(),
            ct);
        if (emailEnUso)
            throw new BusinessRuleException($"RN01: Ya existe un cliente con el email '{email}'.");

        cliente.Email = email;
        cliente.Telefono = string.IsNullOrWhiteSpace(request.Telefono) ? null : request.Telefono.Trim();
        cliente.Calle = request.Calle.Trim();
        cliente.Numero = request.Numero.Trim();
        cliente.Localidad = request.Localidad.Trim();
        cliente.Provincia = request.Provincia.Trim();
        cliente.CodigoPostal = request.CodigoPostal.Trim();

        _clientes.Update(cliente);
        try
        {
            await _unitOfWork.SaveChangesAsync(ct);
        }
        catch (ViolacionUnicidadException exception)
        {
            // Two updates with the same email at the same time passed the check above; the unique
            // index on Email stops the second one (RN01).
            throw new BusinessRuleException($"RN01: Ya existe un cliente con el email '{email}'.", exception);
        }

        return Mapear(cliente);
    }

    /// <summary>
    /// Soft-deletes an active client (RN15): the row stays in the database with <c>Activo = false</c>.
    /// The deletion is rejected while the client has a Pendiente, Vigente or Suspendida policy.
    /// </summary>
    /// <param name="id">Identifier of the client.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <exception cref="NotFoundException">Thrown when the client does not exist or is already deactivated.</exception>
    /// <exception cref="BusinessRuleException">Thrown when the client has an active policy.</exception>
    public async Task DarDeBajaAsync(Guid id, CancellationToken ct = default)
    {
        var cliente = await BuscarActivoAsync(id, ct);

        var tienePolizaActiva = await _polizas.AnyAsync(
            p => p.ClienteId == id
                && (p.Estado == EstadoPoliza.Pendiente
                    || p.Estado == EstadoPoliza.Vigente
                    || p.Estado == EstadoPoliza.Suspendida),
            ct);
        if (tienePolizaActiva)
            throw new BusinessRuleException(
                $"El cliente {id} tiene una póliza activa (Pendiente, Vigente o Suspendida) y no puede darse de baja.");

        cliente.Activo = false;
        _clientes.Update(cliente);
        await _unitOfWork.SaveChangesAsync(ct);
    }

    private async Task<Cliente> BuscarActivoAsync(Guid id, CancellationToken ct)
    {
        var cliente = await _clientes.GetByIdAsync(id, ct);
        // A deactivated client is treated as missing in every endpoint of CU05.
        if (cliente is not { Activo: true })
            throw new NotFoundException($"El cliente {id} no existe.", CodigoClienteNoEncontrado);

        return cliente;
    }

    private static ClienteResponse Mapear(Cliente cliente) => new(
        Id: cliente.Id,
        Dni: cliente.Dni,
        Cuil: cliente.Cuil,
        Nombre: cliente.Nombre,
        Apellido: cliente.Apellido,
        FechaNacimiento: cliente.FechaNacimiento,
        Sexo: cliente.Sexo,
        Email: cliente.Email,
        Telefono: cliente.Telefono,
        Calle: cliente.Calle,
        Numero: cliente.Numero,
        Localidad: cliente.Localidad,
        Provincia: cliente.Provincia,
        CodigoPostal: cliente.CodigoPostal,
        ValidadoRenaper: cliente.ValidadoRenaper,
        FechaValidacionRenaper: cliente.FechaValidacionRenaper,
        Activo: cliente.Activo);
}
