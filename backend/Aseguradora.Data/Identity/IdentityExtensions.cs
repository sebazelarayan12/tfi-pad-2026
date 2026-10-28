using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;

namespace Aseguradora.Data.Identity;

/// <summary>
/// Registers ASP.NET Identity for employees and administrators. Called from AddFrente1, never
/// from AddData, so only Frente 1 depends on Identity (C5, C14).
/// </summary>
public static class IdentityExtensions
{
    public static IServiceCollection AddIdentityAseguradora(this IServiceCollection services)
    {
        services
            .AddIdentityCore<Usuario>()
            .AddRoles<IdentityRole>()
            .AddEntityFrameworkStores<AseguradoraDbContext>();
        return services;
    }
}
