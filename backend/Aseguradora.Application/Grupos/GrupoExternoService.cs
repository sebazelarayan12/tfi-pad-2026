using Aseguradora.Application.Comun;
using Aseguradora.Application.Exceptions;
using Aseguradora.Application.Security;
using Aseguradora.Application.Security.DTOs;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Domain.Interfaces;

namespace Aseguradora.Application.Grupos;

/// <summary>
/// Self-service access for external groups: a group registers, an administrator approves the request,
/// and the approved group generates its own API key. The key is stored hashed and shown once.
/// </summary>
public sealed class GrupoExternoService(
    IRepository<GrupoExterno> grupos,
    IUnitOfWork unidadDeTrabajo,
    IHasherPasswordGrupo hasher,
    ITokenService tokens,
    TimeProvider reloj)
{
    private const int LongitudMinimaPassword = 12;
    private const string MensajeEmailDuplicado = "El email ya está registrado.";
    private const string MensajeNombreDuplicado = "Ya existe un grupo con ese nombre.";
    private const string MensajePasswordDebil =
        "La contraseña debe tener al menos 12 caracteres, con mayúscula, minúscula, número y símbolo.";

    // Checked when the email is unknown, so a missing account takes as long as a wrong password.
    private readonly Lazy<string> _hashFicticio = new(() => hasher.Hash("contrasena-ficticia-Aa1!"));

    /// <summary>Creates the account and a pending request. The group cannot hold a key until it is approved.</summary>
    public async Task<GrupoCuentaResponse> RegistrarAsync(RegistroGrupoRequest solicitud, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(solicitud);
        ValidarPassword(solicitud.Password);

        var email = solicitud.Email.Trim().ToLowerInvariant();
        var nombre = solicitud.Nombre.Trim();

        if (await grupos.AnyAsync(g => g.Email == email, ct))
            throw new BusinessRuleException(MensajeEmailDuplicado);
        if (await grupos.AnyAsync(g => g.Nombre.ToLower() == nombre.ToLower(), ct))
            throw new BusinessRuleException(MensajeNombreDuplicado);

        var grupo = new GrupoExterno
        {
            Nombre = nombre,
            Email = email,
            PasswordHash = hasher.Hash(solicitud.Password),
            Contacto = solicitud.Contacto.Trim(),
            Descripcion = solicitud.Descripcion.Trim(),
            Estado = EstadoGrupo.Pendiente,
            FechaSolicitud = Ahora()
        };

        await grupos.AddAsync(grupo, ct);
        await GuardarAsync(ct);
        return ACuenta(grupo);
    }

    /// <summary>
    /// Validates the credentials and returns a token with the <see cref="Roles.Grupo"/> role. A group whose
    /// request was rejected can still sign in, to read the reason. An unknown email and a wrong password fail alike.
    /// </summary>
    public async Task<LoginResponse> LoginAsync(LoginRequest solicitud, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(solicitud);

        var email = solicitud.Email.Trim().ToLowerInvariant();
        var grupo = (await grupos.FindAsync(g => g.Email == email, ct)).SingleOrDefault();

        var passwordValida = hasher.Verificar(grupo?.PasswordHash ?? _hashFicticio.Value, solicitud.Password);
        if (grupo is null || !passwordValida)
            throw new CredencialesInvalidasException();

        var token = tokens.CrearToken(new UsuarioCuenta(grupo.Id.ToString(), grupo.Email, Nombre: grupo.Nombre), Roles.Grupo);
        return new LoginResponse(token.Token, Roles.Grupo, token.ExpiraEn);
    }

    /// <summary>The group's own account, request state and key summary.</summary>
    public async Task<GrupoCuentaResponse> ObtenerCuentaAsync(Guid id, CancellationToken ct = default) =>
        ACuenta(await BuscarAsync(id, ct));

    /// <summary>
    /// Creates a new key for an approved group and returns it. The previous key stops working at once;
    /// only the hash of the new one is stored, so the value cannot be read again.
    /// </summary>
    public async Task<ClaveGeneradaResponse> GenerarClaveAsync(Guid id, CancellationToken ct = default)
    {
        var grupo = await BuscarAsync(id, ct);
        if (grupo.Estado != EstadoGrupo.Aprobada)
            throw new BusinessRuleException("Tu solicitud todavía no está aprobada.");

        var clave = ClaveApi.Generar();
        var ahora = Ahora();
        grupo.ClaveHash = ClaveApi.Hash(clave);
        grupo.ClavePrefijo = ClaveApi.PrefijoVisible(clave);
        grupo.ClaveCreadaEn = ahora;

        grupos.Update(grupo);
        await GuardarAsync(ct);
        return new ClaveGeneradaResponse(clave, grupo.ClavePrefijo, ahora);
    }

    /// <summary>The approved group that holds this key, or null when it is unknown, revoked or malformed.</summary>
    public async Task<GrupoAutenticado?> ValidarClaveAsync(string? clave, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(clave) || !clave.StartsWith(ClaveApi.Prefijo, StringComparison.Ordinal))
            return null;

        var hash = ClaveApi.Hash(clave);
        var grupo = (await grupos.FindAsync(g => g.ClaveHash == hash, ct)).SingleOrDefault();
        return grupo is { Estado: EstadoGrupo.Aprobada } ? new GrupoAutenticado(grupo.Id, grupo.Nombre) : null;
    }

    /// <summary>Groups for the administrator, newest request first.</summary>
    public Task<PaginaResponse<GrupoListItemResponse>> ListarAsync(
        EstadoGrupo? estado, int pagina, int tamano, CancellationToken ct = default)
    {
        ct.ThrowIfCancellationRequested();
        pagina = Math.Max(1, pagina);
        tamano = Math.Clamp(tamano, 1, 100);

        var consulta = grupos.Query();
        if (estado is { } e)
            consulta = consulta.Where(g => g.Estado == e);

        var total = consulta.Count();
        var items = consulta
            .OrderByDescending(g => g.FechaSolicitud)
            .ThenBy(g => g.Id)
            .Skip((pagina - 1) * tamano)
            .Take(tamano)
            .ToList()
            .Select(AItem)
            .ToList();

        return Task.FromResult(new PaginaResponse<GrupoListItemResponse>(items, pagina, tamano, total));
    }

    /// <summary>Approves a pending, rejected or revoked request. A revoked group generates a new key afterwards.</summary>
    public async Task<GrupoListItemResponse> AprobarAsync(Guid id, CancellationToken ct = default)
    {
        var grupo = await BuscarAsync(id, ct);
        if (grupo.Estado == EstadoGrupo.Aprobada)
            throw new BusinessRuleException("El grupo ya está aprobado.");

        Resolver(grupo, EstadoGrupo.Aprobada, motivo: null);
        return await GuardarCambioAsync(grupo, ct);
    }

    /// <summary>Rejects a pending request, with a reason the group can read.</summary>
    public async Task<GrupoListItemResponse> RechazarAsync(Guid id, MotivoRequest solicitud, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(solicitud);
        var grupo = await BuscarAsync(id, ct);
        if (grupo.Estado != EstadoGrupo.Pendiente)
            throw new BusinessRuleException("Solo se puede rechazar una solicitud pendiente.");

        Resolver(grupo, EstadoGrupo.Rechazada, solicitud.Motivo);
        return await GuardarCambioAsync(grupo, ct);
    }

    /// <summary>Withdraws the access of an approved group: its key stops working and is deleted.</summary>
    public async Task<GrupoListItemResponse> RevocarAsync(Guid id, MotivoRequest solicitud, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(solicitud);
        var grupo = await BuscarAsync(id, ct);
        if (grupo.Estado != EstadoGrupo.Aprobada)
            throw new BusinessRuleException("Solo se puede revocar el acceso de un grupo aprobado.");

        Resolver(grupo, EstadoGrupo.Revocada, solicitud.Motivo);
        grupo.ClaveHash = null;
        grupo.ClavePrefijo = null;
        grupo.ClaveCreadaEn = null;
        return await GuardarCambioAsync(grupo, ct);
    }

    private void Resolver(GrupoExterno grupo, EstadoGrupo estado, string? motivo)
    {
        grupo.Estado = estado;
        grupo.Motivo = motivo?.Trim();
        grupo.FechaResolucion = Ahora();
    }

    private async Task<GrupoListItemResponse> GuardarCambioAsync(GrupoExterno grupo, CancellationToken ct)
    {
        grupos.Update(grupo);
        await GuardarAsync(ct);
        return AItem(grupo);
    }

    private async Task GuardarAsync(CancellationToken ct)
    {
        try
        {
            await unidadDeTrabajo.SaveChangesAsync(ct);
        }
        catch (ViolacionUnicidadException)
        {
            // Another request registered the same email or name first.
            throw new BusinessRuleException("Ya existe un grupo con ese email o nombre.");
        }
    }

    private async Task<GrupoExterno> BuscarAsync(Guid id, CancellationToken ct) =>
        await grupos.GetByIdAsync(id, ct) ?? throw new NotFoundException("El grupo no existe.");

    private DateTime Ahora() => reloj.GetUtcNow().UtcDateTime;

    private static void ValidarPassword(string password)
    {
        var valida = password.Length >= LongitudMinimaPassword
            && password.Any(char.IsUpper)
            && password.Any(char.IsLower)
            && password.Any(char.IsDigit)
            && password.Any(c => !char.IsLetterOrDigit(c));
        if (!valida)
            throw new BusinessRuleException(MensajePasswordDebil);
    }

    private static GrupoCuentaResponse ACuenta(GrupoExterno g) => new(
        g.Id, g.Nombre, g.Email, g.Contacto, g.Descripcion, g.Estado, g.Motivo,
        g.FechaSolicitud, g.FechaResolucion, g.ClaveHash is not null, g.ClavePrefijo, g.ClaveCreadaEn);

    private static GrupoListItemResponse AItem(GrupoExterno g) => new(
        g.Id, g.Nombre, g.Email, g.Contacto, g.Descripcion, g.Estado, g.Motivo,
        g.FechaSolicitud, g.FechaResolucion, g.ClaveHash is not null);
}
