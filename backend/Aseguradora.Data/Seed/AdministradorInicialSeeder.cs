using Aseguradora.Application.Security;
using Aseguradora.Data.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Aseguradora.Data.Seed;

/// <summary>
/// Creates the initial administrator from Seed:Administrador:Email and
/// Seed:Administrador:Password (environment variables Seed__Administrador__Email/Password).
/// Idempotent: a second startup finds the user and only ensures the role (C14, US-F1-02).
/// Missing credentials or a password rejected by the Identity policy are logged and do not
/// stop the application.
/// </summary>
public sealed class AdministradorInicialSeeder(
    UserManager<Usuario> usuarioManager,
    IConfiguration configuration,
    ILogger<AdministradorInicialSeeder> logger) : ISeeder
{
    public const string ClaveEmail = "Seed:Administrador:Email";
    public const string ClavePassword = "Seed:Administrador:Password";

    public async Task SembrarAsync(IServiceProvider services, CancellationToken ct)
    {
        var email = configuration[ClaveEmail];
        var password = configuration[ClavePassword];

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
        {
            logger.LogWarning(
                "Sin {ClaveEmail} y {ClavePassword}: no se crea el administrador inicial.",
                ClaveEmail,
                ClavePassword);
            return;
        }

        var usuario = await usuarioManager.FindByEmailAsync(email);
        if (usuario is null)
        {
            usuario = new Usuario
            {
                UserName = email,
                Email = email,
                Nombre = "Administrador",
                Apellido = "Inicial",
                EmailConfirmed = true
            };

            var creado = await usuarioManager.CreateAsync(usuario, password);
            if (!creado.Succeeded)
            {
                logger.LogError(
                    "No se pudo crear el administrador inicial {Email}: {Errores}",
                    email,
                    string.Join(" ", creado.Errors.Select(error => error.Description)));
                return;
            }
        }

        if (await usuarioManager.IsInRoleAsync(usuario, Roles.Administrador))
            return;

        var asignado = await usuarioManager.AddToRoleAsync(usuario, Roles.Administrador);
        if (!asignado.Succeeded)
        {
            logger.LogError(
                "No se pudo asignar el rol {Rol} al administrador inicial {Email}: {Errores}",
                Roles.Administrador,
                email,
                string.Join(" ", asignado.Errors.Select(error => error.Description)));
        }
    }
}
