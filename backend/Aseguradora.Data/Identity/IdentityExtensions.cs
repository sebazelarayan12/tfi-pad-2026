using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;

namespace Aseguradora.Data.Identity;

/// <summary>
/// Registers ASP.NET Identity for employees and administrators. Called from AddFrente1, never
/// from AddData, so only Frente 1 depends on Identity (C5, C14).
/// </summary>
public static class IdentityExtensions
{
    /// <summary>Minimum password length. The front validates the same value (US-FE-B-26).</summary>
    public const int LongitudMinimaPassword = 12;

    public static IServiceCollection AddIdentityAseguradora(this IServiceCollection services)
    {
        services
            .AddIdentityCore<Usuario>(opciones =>
            {
                // Strong password policy (US-F1-09): create, change and initial administrator seed.
                opciones.Password.RequiredLength = LongitudMinimaPassword;
                opciones.Password.RequireUppercase = true;
                opciones.Password.RequireLowercase = true;
                opciones.Password.RequireDigit = true;
                opciones.Password.RequireNonAlphanumeric = true;
            })
            .AddRoles<IdentityRole>()
            .AddErrorDescriber<IdentityErrorDescriberEspanol>()
            .AddEntityFrameworkStores<AseguradoraDbContext>();
        return services;
    }
}
