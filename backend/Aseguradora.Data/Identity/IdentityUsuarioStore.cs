using Aseguradora.Application.Exceptions;
using Aseguradora.Application.Security;
using Microsoft.AspNetCore.Identity;

namespace Aseguradora.Data.Identity;

/// <summary>
/// <see cref="IUsuarioStore"/> on top of <see cref="UserManager{TUser}"/> (CU01, CU03). This is
/// the only place that knows Identity, so Application stays free of it (US-F1-03).
/// </summary>
public sealed class IdentityUsuarioStore(UserManager<Usuario> usuarios) : IUsuarioStore
{
    // Dummy hash for unknown emails: verifying it costs the same PBKDF2 work as a real
    // password, so response time does not reveal whether the account exists. It uses the
    // default Identity hasher, which is the one configured in AddIdentityAseguradora.
    private static readonly Usuario UsuarioFicticio = new();

    private static readonly Lazy<string> HashFicticio = new(() =>
        new PasswordHasher<Usuario>().HashPassword(UsuarioFicticio, Guid.NewGuid().ToString("N")));

    public async Task<UsuarioCuenta?> BuscarPorEmailAsync(string email, CancellationToken ct = default)
    {
        ct.ThrowIfCancellationRequested();
        var usuario = await usuarios.FindByEmailAsync(email);
        return usuario is null ? null : ADatos(usuario);
    }

    public async Task<bool> VerificarPasswordAsync(
        UsuarioCuenta? usuario,
        string password,
        CancellationToken ct = default)
    {
        ct.ThrowIfCancellationRequested();

        if (usuario is null)
        {
            usuarios.PasswordHasher.VerifyHashedPassword(UsuarioFicticio, HashFicticio.Value, password);
            return false;
        }

        var entidad = await usuarios.FindByIdAsync(usuario.Id);
        return entidad is not null && await usuarios.CheckPasswordAsync(entidad, password);
    }

    public async Task<IReadOnlyList<string>> ObtenerRolesAsync(
        UsuarioCuenta usuario,
        CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(usuario);
        ct.ThrowIfCancellationRequested();

        var entidad = await usuarios.FindByIdAsync(usuario.Id);
        return entidad is null ? [] : [.. await usuarios.GetRolesAsync(entidad)];
    }

    public async Task<UsuarioCuenta> CrearAsync(
        string email,
        string password,
        string rol,
        string nombre,
        string apellido,
        CancellationToken ct = default)
    {
        ct.ThrowIfCancellationRequested();

        var usuario = new Usuario
        {
            UserName = email,
            Email = email,
            Nombre = nombre,
            Apellido = apellido,
            EmailConfirmed = true
        };

        var creado = await usuarios.CreateAsync(usuario, password);
        if (!creado.Succeeded)
            throw new BusinessRuleException(Describir(creado));

        var asignado = await usuarios.AddToRoleAsync(usuario, rol);
        if (!asignado.Succeeded)
        {
            // Do not leave a user without its role behind if the assignment fails.
            await usuarios.DeleteAsync(usuario);
            throw new BusinessRuleException(Describir(asignado));
        }

        return ADatos(usuario);
    }

    public async Task<bool> EmailExisteAsync(string email, CancellationToken ct = default)
    {
        ct.ThrowIfCancellationRequested();
        return await usuarios.FindByEmailAsync(email) is not null;
    }

    private static UsuarioCuenta ADatos(Usuario usuario) =>
        new(usuario.Id, usuario.Email ?? usuario.UserName ?? string.Empty);

    private static string Describir(IdentityResult resultado) =>
        string.Join(" ", resultado.Errors.Select(error => error.Description));
}
