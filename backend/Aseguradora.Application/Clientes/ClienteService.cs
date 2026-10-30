using Aseguradora.Application.Clientes.DTOs;
using Aseguradora.Application.Exceptions;
using Aseguradora.Application.External;
using Aseguradora.Application.Tiempo;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace Aseguradora.Application.Clientes;

/// <summary>
/// Registration and Renaper validation of clients (CU04, RN01, RN02, RN16).
/// The controller only maps HTTP; every rule lives here.
/// </summary>
public sealed class ClienteService(
    IRepository<Cliente> clientes,
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

    private readonly IRepository<Cliente> _clientes = clientes ?? throw new ArgumentNullException(nameof(clientes));
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
            throw new BusinessRuleException("El DNI debe tener 8 dígitos.");

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

        var (persona, renaperDisponible) = await ObtenerPersonaTolerandoCaidaAsync(dni, ct);

        if (persona is { Estado: EstadoRenaper.Fallecido })
            throw new BusinessRuleException("RN02: La persona figura como fallecida en Renaper.");

        if (persona is null && renaperDisponible)
            throw new BusinessRuleException($"El DNI '{dni}' no figura en Renaper.");

        var fechaNacimiento = persona?.FechaNacimiento ?? fechaNacimientoIngresada;
        if (!EsMayorDeEdad(fechaNacimiento))
            throw new BusinessRuleException($"RN01: El cliente debe tener {EdadMinima} años o más.");

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
            ValidadoRenaper = persona is not null,
            FechaValidacionRenaper = persona is not null ? _reloj.GetUtcNow().UtcDateTime : null,
            Activo = true
        };

        if (persona is not null)
            AplicarDatosRenaper(cliente, persona);

        await _clientes.AddAsync(cliente, ct);
        await _unitOfWork.SaveChangesAsync(ct);

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

        var persona = await _renaper.ObtenerPorDniAsync(cliente.Dni, ct)
            ?? throw new BusinessRuleException($"El DNI '{cliente.Dni}' no figura en Renaper.");

        if (persona.Estado == EstadoRenaper.Fallecido)
            throw new BusinessRuleException("RN02: La persona figura como fallecida en Renaper.");

        if (!EsMayorDeEdad(persona.FechaNacimiento))
            throw new BusinessRuleException($"RN01: El cliente debe tener {EdadMinima} años o más.");

        AplicarDatosRenaper(cliente, persona);
        cliente.ValidadoRenaper = true;
        cliente.FechaValidacionRenaper = _reloj.GetUtcNow().UtcDateTime;

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
            throw new BusinessRuleException("El DNI debe tener 8 dígitos.");

        var persona = await _renaper.ObtenerPorDniAsync(normalizado, ct)
            ?? throw new NotFoundException($"El DNI '{normalizado}' no figura en Renaper.", CodigoDniNoEncontrado);

        return MapearRenaper(persona);
    }

    private async Task<(PersonaRenaper? Persona, bool Disponible)> ObtenerPersonaTolerandoCaidaAsync(
        string dni,
        CancellationToken ct)
    {
        try
        {
            return (await _renaper.ObtenerPorDniAsync(dni, ct), true);
        }
        catch (ExternalServiceException exception)
        {
            // C8: losing the form is worse than registering an unvalidated client; the retry is explicit.
            _logger.LogWarning(exception, "Renaper no respondió al dar de alta el DNI {Dni}; se guarda sin validar.", dni);
            return (null, false);
        }
    }

    private bool EsMayorDeEdad(DateOnly fechaNacimiento)
    {
        var hoy = FechaArgentina.Hoy(_reloj);
        var edad = hoy.Year - fechaNacimiento.Year;
        if (fechaNacimiento > hoy.AddYears(-edad))
            edad--;

        return edad >= EdadMinima;
    }

    private static bool EsDniValido(string dni) => dni.Length == 8 && dni.All(char.IsAsciiDigit);

    private static void AplicarDatosRenaper(Cliente cliente, PersonaRenaper persona)
    {
        cliente.Nombre = persona.Nombre.Trim();
        cliente.Apellido = persona.Apellido.Trim();
        cliente.Cuil = persona.Cuil.Trim();
        cliente.FechaNacimiento = persona.FechaNacimiento;
        cliente.Sexo = char.ToUpperInvariant(persona.Sexo);
        cliente.Calle = persona.Domicilio.Calle.Trim();
        cliente.Numero = persona.Domicilio.Numero.Trim();
        cliente.Localidad = persona.Domicilio.Localidad.Trim();
        cliente.Provincia = persona.Domicilio.Provincia.Trim();
        cliente.CodigoPostal = persona.Domicilio.CodigoPostal.Trim();
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
        Domicilio: new DomicilioRenaperResponse(
            Calle: persona.Domicilio.Calle,
            Numero: persona.Domicilio.Numero,
            Piso: persona.Domicilio.Piso,
            Depto: persona.Domicilio.Depto,
            Localidad: persona.Domicilio.Localidad,
            Provincia: persona.Domicilio.Provincia,
            CodigoPostal: persona.Domicilio.CodigoPostal),
        Estado: persona.Estado == EstadoRenaper.Fallecido ? "FALLECIDO" : "VIGENTE",
        FechaFallecimiento: persona.FechaFallecimiento);
}
