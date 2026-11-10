using Aseguradora.Application.Clientes.DTOs;
using Aseguradora.Application.Comun;
using Aseguradora.Application.Exceptions;
using Aseguradora.Application.External;
using Aseguradora.Application.Tiempo;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace Aseguradora.Application.Clientes;

/// <summary>
/// Registration, Renaper validation, query, modification and soft deletion of clients
/// (CU04, CU05, RN01, RN02, RN15, RN16).
/// The controller only maps HTTP; every rule lives here.
/// </summary>
public sealed class ClienteService(
    IRepository<Cliente> clientes,
    IRepository<Poliza> polizas,
    IRenaperService renaper,
    IUnitOfWork unitOfWork,
    TimeProvider reloj,
    ILogger<ClienteService> logger)
{
    /// <summary>Stable reason code returned when the requested client does not exist.</summary>
    public const string CodigoClienteNoEncontrado = "CLIENTE_NO_ENCONTRADO";

    /// <summary>Stable reason code returned when Renaper does not know the DNI (contract 9.1).</summary>
    public const string CodigoDniNoEncontrado = "PERSONA_NO_ENCONTRADA";

    private const int EdadMinima = 18;
    private const string MensajeFallecido = "RN02: La persona figura como fallecida en Renaper.";
    private const string MensajeDniInvalido = "El DNI debe tener 8 dígitos.";

    private readonly IRepository<Cliente> _clientes = clientes ?? throw new ArgumentNullException(nameof(clientes));
    private readonly IRepository<Poliza> _polizas = polizas ?? throw new ArgumentNullException(nameof(polizas));
    private readonly IRenaperService _renaper = renaper ?? throw new ArgumentNullException(nameof(renaper));
    private readonly IUnitOfWork _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    private readonly TimeProvider _reloj = reloj ?? throw new ArgumentNullException(nameof(reloj));
    private readonly ILogger<ClienteService> _logger = logger ?? throw new ArgumentNullException(nameof(logger));

    /// <summary>
    /// Registers a client after checking DNI and email uniqueness and the minimum age, and
    /// overwriting the typed data with Renaper's when the person is valid (CU04, RN01, RN02).
    /// When Renaper is down the client is still registered with <c>ValidadoRenaper = false</c>,
    /// so the employee does not lose the form (C8); the retry stays in <see cref="ValidarRenaperAsync"/>.
    /// </summary>
    /// <param name="request">Client data typed by the employee.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>The persisted client.</returns>
    /// <exception cref="BusinessRuleException">
    /// Thrown when the DNI or email is already registered, the person is under 18, or Renaper
    /// reports the person as deceased or unknown.
    /// </exception>
    public async Task<ClienteResponse> AltaAsync(ClienteAltaRequest request, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var dni = request.Dni.Trim();
        if (!EsDniValido(dni))
            throw new BusinessRuleException(MensajeDniInvalido);

        var email = request.Email.Trim();
        var sexo = char.ToUpperInvariant(request.Sexo ?? '\0');
        if (sexo is not ('M' or 'F' or 'X'))
            throw new BusinessRuleException("El sexo debe ser M, F o X.");

        if (request.FechaNacimiento is not { } fechaNacimientoIngresada)
            throw new BusinessRuleException("La fecha de nacimiento es obligatoria.");

        if (await _clientes.AnyAsync(c => c.Dni == dni, ct))
            throw new BusinessRuleException($"RN01: Ya existe un cliente con el DNI '{dni}'.");

        if (await _clientes.AnyAsync(c => c.Email.ToLower() == email.ToLower(), ct))
            throw new BusinessRuleException($"RN01: Ya existe un cliente con el email '{email}'.");

        var (persona, renaperDisponible) = await ObtenerPersonaTolerandoCaidaAsync(dni, request.Cuil, ct);

        if (persona is not null)
            ValidarPersonaVigente(persona);

        if (persona is null && renaperDisponible)
            throw new BusinessRuleException($"El DNI '{dni}' no figura en Renaper.");

        ValidarMayorDeEdad(persona, fechaNacimientoIngresada);

        var cliente = new Cliente
        {
            Id = Guid.NewGuid(),
            Dni = dni,
            Email = email,
            Telefono = string.IsNullOrWhiteSpace(request.Telefono) ? null : request.Telefono.Trim(),
            Nombre = request.Nombre.Trim(),
            Apellido = request.Apellido.Trim(),
            Cuil = request.Cuil.Trim(),
            FechaNacimiento = fechaNacimientoIngresada,
            Sexo = sexo,
            Calle = request.Calle.Trim(),
            Numero = request.Numero.Trim(),
            Localidad = request.Localidad.Trim(),
            Provincia = request.Provincia.Trim(),
            CodigoPostal = request.CodigoPostal.Trim(),
            // Without a birth date or an age, Renaper could not check RN01: the client stays unvalidated.
            ValidadoRenaper = persona is not null && EdadVerificable(persona),
            FechaValidacionRenaper = persona is not null && EdadVerificable(persona) ? _reloj.GetUtcNow().UtcDateTime : null,
            Activo = true
        };

        if (persona is not null)
            AplicarDatosRenaper(cliente, persona);

        await _clientes.AddAsync(cliente, ct);
        try
        {
            await _unitOfWork.SaveChangesAsync(ct);
        }
        catch (ViolacionUnicidadException exception)
        {
            // Two registrations with the same DNI or email passed the checks above at the same time;
            // the unique indexes stop the second one (RN01).
            throw new BusinessRuleException(
                "RN01: Otro cliente con el mismo DNI o email se registró al mismo tiempo. Recargue los datos.", exception);
        }

        return Mapear(cliente);
    }

    /// <summary>
    /// Retries the Renaper validation of an existing client (CU04). When Renaper answers
    /// <c>VIGENTE</c>, the client is marked as validated and its data is refreshed (RN02).
    /// </summary>
    /// <param name="id">Identifier of the client.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>The updated client.</returns>
    /// <exception cref="NotFoundException">Thrown when the client does not exist.</exception>
    /// <exception cref="BusinessRuleException">
    /// Thrown when the DNI does not exist in Renaper, the person is deceased, or is under 18.
    /// </exception>
    /// <exception cref="ExternalServiceException">Thrown when Renaper fails or times out.</exception>
    public async Task<ClienteResponse> ValidarRenaperAsync(Guid id, CancellationToken ct = default)
    {
        var cliente = await _clientes.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"El cliente {id} no existe.", CodigoClienteNoEncontrado);

        var persona = await ConsultarRenaperAsync(cliente.Dni, cliente.Cuil, ct)
            ?? throw new BusinessRuleException($"El DNI '{cliente.Dni}' no figura en Renaper.");

        ValidarPersonaVigente(persona);
        ValidarMayorDeEdad(persona, cliente.FechaNacimiento);

        AplicarDatosRenaper(cliente, persona);
        if (EdadVerificable(persona))
        {
            cliente.ValidadoRenaper = true;
            cliente.FechaValidacionRenaper = _reloj.GetUtcNow().UtcDateTime;
        }

        await _unitOfWork.SaveChangesAsync(ct);

        return Mapear(cliente);
    }

    /// <summary>
    /// Returns what Renaper knows about a DNI so the employee can pre-load the form (CU04).
    /// </summary>
    /// <param name="dni">Document number, exactly 8 digits.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>The person data returned by Renaper.</returns>
    /// <exception cref="BusinessRuleException">Thrown when the DNI format is invalid.</exception>
    /// <exception cref="NotFoundException">Thrown when Renaper does not know the DNI.</exception>
    /// <exception cref="ExternalServiceException">Thrown when Renaper fails or times out.</exception>
    public async Task<PersonaRenaperResponse> PreviewRenaperAsync(string dni, CancellationToken ct = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(dni);

        var normalizado = dni.Trim();
        if (!EsDniValido(normalizado))
            throw new BusinessRuleException(MensajeDniInvalido);

        var persona = await _renaper.ObtenerPorDniAsync(normalizado, ct)
            ?? throw new NotFoundException($"El DNI '{normalizado}' no figura en Renaper.", CodigoDniNoEncontrado);

        return MapearRenaper(persona);
    }

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
            // Both sides drop the acute accent and the diaeresis (á é í ó ú ü) so "perez" finds "Pérez".
            // The ñ is a different letter in Spanish and is kept. The REPLACE chain translates on SQL Server and
            // SQLite, so no provider-specific collation is needed and the schema does not change.
            var apellido = SinTildes(filtro.Apellido.Trim().ToLowerInvariant());
            consulta = consulta.Where(c => c.Apellido.ToLower()
                .Replace("á", "a").Replace("é", "e").Replace("í", "i")
                .Replace("ó", "o").Replace("ú", "u").Replace("ü", "u")
                .Contains(apellido));
        }

        var total = consulta.Count();
        var items = consulta
            .OrderBy(c => c.Apellido)
            .ThenBy(c => c.Nombre)
            .ThenBy(c => c.Dni)
            .Skip((filtro.Pagina - 1) * filtro.TamanoPagina)
            .Take(filtro.TamanoPagina)
            .Select(c => new ClienteResumenResponse(
                c.Id, c.Dni, c.Nombre, c.Apellido, c.Email, c.Telefono, c.Activo,
                c.ValidadoRenaper,
                c.Vehiculos.Count(v => v.Activo),
                c.Polizas.Count(p => p.Estado == EstadoPoliza.Pendiente
                    || p.Estado == EstadoPoliza.Vigente
                    || p.Estado == EstadoPoliza.Suspendida)))
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

    /// <summary>
    /// Asks Renaper by DNI and, when the DNI is shared by several people, settles it by CUIL
    /// (the CUIL the employee typed or the one already stored for the client).
    /// </summary>
    private async Task<PersonaRenaper?> ConsultarRenaperAsync(string dni, string? cuil, CancellationToken ct)
    {
        try
        {
            return await _renaper.ObtenerPorDniAsync(dni, ct);
        }
        catch (PersonaAmbiguaException) when (CuilNormalizado(cuil) is not null)
        {
            return await _renaper.ObtenerPorCuilAsync(CuilNormalizado(cuil)!, ct);
        }
    }

    private static string? CuilNormalizado(string? cuil)
    {
        var digitos = new string((cuil ?? string.Empty).Where(char.IsAsciiDigit).ToArray());
        return digitos.Length == 11 ? digitos : null;
    }

    private async Task<(PersonaRenaper? Persona, bool Disponible)> ObtenerPersonaTolerandoCaidaAsync(
        string dni,
        string? cuil,
        CancellationToken ct)
    {
        try
        {
            return (await ConsultarRenaperAsync(dni, cuil, ct), true);
        }
        catch (ExternalServiceException exception)
        {
            // C8: losing the form is worse than registering an unvalidated client; the retry is explicit.
            _logger.LogWarning(exception, "Renaper no respondió al dar de alta el DNI {Dni}; se guarda sin validar.", dni);
            return (null, false);
        }
    }

    private static void ValidarPersonaVigente(PersonaRenaper persona)
    {
        if (persona.Estado == EstadoRenaper.Fallecido)
            throw new BusinessRuleException(MensajeFallecido);
    }

    /// <summary>
    /// RN01 with the best evidence available: Renaper's birth date, else Renaper's age, else the date the
    /// employee typed (Renaper may not publish either).
    /// </summary>
    private void ValidarMayorDeEdad(PersonaRenaper? persona, DateOnly fechaNacimientoIngresada)
    {
        var mayor = persona switch
        {
            { FechaNacimiento: { } fecha } => EsMayorDeEdad(fecha),
            { Edad: { } edad } => edad >= EdadMinima,
            _ => EsMayorDeEdad(fechaNacimientoIngresada)
        };

        if (!mayor)
            throw new BusinessRuleException($"RN01: El cliente debe tener {EdadMinima} años o más.");
    }

    private static bool EdadVerificable(PersonaRenaper persona) =>
        persona.FechaNacimiento is not null || persona.Edad is not null;

    private bool EsMayorDeEdad(DateOnly fechaNacimiento)
    {
        var hoy = FechaArgentina.Hoy(_reloj);
        var edad = hoy.Year - fechaNacimiento.Year;
        if (fechaNacimiento > hoy.AddYears(-edad))
            edad--;

        return edad >= EdadMinima;
    }

    private static bool EsDniValido(string dni) => dni.Length == 8 && dni.All(char.IsAsciiDigit);

    /// <summary>Lowercase text without acute accents or diaeresis; must match the REPLACE chain in <see cref="ListarAsync"/>.</summary>
    private static string SinTildes(string textoEnMinusculas) => textoEnMinusculas
        .Replace('á', 'a').Replace('é', 'e').Replace('í', 'i')
        .Replace('ó', 'o').Replace('ú', 'u').Replace('ü', 'u');

    private static void AplicarDatosRenaper(Cliente cliente, PersonaRenaper persona)
    {
        // Renaper only overwrites what it publishes; the rest keeps what the employee typed.
        // The real source gives one name string, so name and last name are replaced together or not at all.
        if (!string.IsNullOrWhiteSpace(persona.Apellido))
        {
            cliente.Nombre = persona.Nombre.Trim();
            cliente.Apellido = persona.Apellido.Trim();
        }

        if (!string.IsNullOrWhiteSpace(persona.Cuil))
            cliente.Cuil = persona.Cuil.Trim();
        if (persona.FechaNacimiento is { } fechaNacimiento)
            cliente.FechaNacimiento = fechaNacimiento;
        if (persona.Sexo is { } sexo)
            cliente.Sexo = char.ToUpperInvariant(sexo);

        if (persona.Domicilio is { } domicilio)
        {
            cliente.Calle = domicilio.Calle.Trim();
            cliente.Numero = domicilio.Numero.Trim();
            cliente.Localidad = domicilio.Localidad.Trim();
            cliente.Provincia = domicilio.Provincia.Trim();
            cliente.CodigoPostal = domicilio.CodigoPostal.Trim();
        }
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

    private static PersonaRenaperResponse MapearRenaper(PersonaRenaper persona) => new(
        Dni: persona.Dni,
        Cuil: persona.Cuil,
        Nombre: persona.Nombre,
        Apellido: persona.Apellido,
        FechaNacimiento: persona.FechaNacimiento,
        Sexo: persona.Sexo,
        Domicilio: persona.Domicilio is { } domicilio
            ? new DomicilioRenaperResponse(
                Calle: domicilio.Calle,
                Numero: domicilio.Numero,
                Piso: domicilio.Piso,
                Depto: domicilio.Depto,
                Localidad: domicilio.Localidad,
                Provincia: domicilio.Provincia,
                CodigoPostal: domicilio.CodigoPostal)
            : null,
        Estado: persona.Estado == EstadoRenaper.Fallecido ? "FALLECIDO" : "VIGENTE",
        FechaFallecimiento: persona.FechaFallecimiento);
}
