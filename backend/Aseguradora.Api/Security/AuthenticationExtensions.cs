using System.Security.Claims;
using System.Text;
using Aseguradora.Application.Security;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Aseguradora.Api.Security;

/// <summary>
/// Registers JWT Bearer for employees and administrators, the ApiKey scheme for external systems,
/// and the three shared policies of the literal table (C10).
/// </summary>
public static class AuthenticationExtensions
{
    public static IServiceCollection AddSeguridad(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddOptions<JwtOpciones>()
            .Bind(configuration.GetSection(JwtOpciones.Seccion))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services.AddOptions<ApiKeyOpciones>()
            .Configure(opciones => configuration.GetSection(ApiKeyOpciones.Seccion).Bind(opciones.ApiKeys))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services.AddAuthentication(options =>
            {
                options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(JwtBearerDefaults.AuthenticationScheme)
            .AddScheme<AuthenticationSchemeOptions, ApiKeyAuthenticationHandler>(
                ApiKeyAuthenticationHandler.Esquema, configureOptions: null);

        // The bearer options are configured from the typed options, so a missing or short
        // Jwt__Key fails the startup validation before any request is served.
        services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
            .Configure<IOptions<JwtOpciones>>((bearer, jwt) =>
            {
                var jwtOpciones = jwt.Value;
                bearer.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = jwtOpciones.Issuer,
                    ValidateAudience = true,
                    ValidAudience = jwtOpciones.Audience,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOpciones.Key)),
                    RoleClaimType = ClaimTypes.Role,
                    ClockSkew = TimeSpan.Zero
                };
            });

        services.AddAuthorization(options =>
        {
            options.AddPolicy(Politicas.Empleado, policy => policy
                .AddAuthenticationSchemes(JwtBearerDefaults.AuthenticationScheme)
                .RequireAuthenticatedUser()
                .RequireRole(Roles.Empleado, Roles.Administrador));

            options.AddPolicy(Politicas.Admin, policy => policy
                .AddAuthenticationSchemes(JwtBearerDefaults.AuthenticationScheme)
                .RequireAuthenticatedUser()
                .RequireRole(Roles.Administrador));

            options.AddPolicy(Politicas.ApiKey, policy => policy
                .AddAuthenticationSchemes(ApiKeyAuthenticationHandler.Esquema)
                .RequireAuthenticatedUser()
                .RequireClaim(ClaimsAseguradora.Proveedor));
        });

        return services;
    }
}
