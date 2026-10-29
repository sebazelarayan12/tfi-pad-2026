using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Aseguradora.Application.Security;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Aseguradora.Api.Security;

/// <summary>
/// Signs the JWT of <c>POST /api/auth/login</c> with the options of US-F1-01. The token carries
/// the <c>sub</c>, <c>email</c> and <c>role</c> claims that the rest of the back consumes
/// (US-F1-03).
/// </summary>
public sealed class JwtTokenService(IOptions<JwtOpciones> opciones, TimeProvider reloj) : ITokenService
{
    private readonly JwtOpciones _opciones =
        opciones?.Value ?? throw new ArgumentNullException(nameof(opciones));

    private readonly TimeProvider _reloj = reloj ?? throw new ArgumentNullException(nameof(reloj));

    public TokenEmitido CrearToken(UsuarioCuenta usuario, string rol)
    {
        ArgumentNullException.ThrowIfNull(usuario);
        ArgumentException.ThrowIfNullOrWhiteSpace(rol);

        var emision = _reloj.GetUtcNow();
        var expiracion = emision.AddMinutes(_opciones.ExpiracionMinutos);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, usuario.Id),
            new(JwtRegisteredClaimNames.Email, usuario.Email),
            // Short name: the JWT handler maps "role" to ClaimTypes.Role while validating.
            new(ClaimsAseguradora.Rol, rol)
        };

        var credenciales = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_opciones.Key)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _opciones.Issuer,
            audience: _opciones.Audience,
            claims: claims,
            notBefore: emision.UtcDateTime,
            expires: expiracion.UtcDateTime,
            signingCredentials: credenciales);

        return new TokenEmitido(new JwtSecurityTokenHandler().WriteToken(token), expiracion);
    }
}
