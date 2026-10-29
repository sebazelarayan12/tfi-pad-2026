using System.IdentityModel.Tokens.Jwt;
using Aseguradora.Api.Security;
using Aseguradora.Application.Security;
using Aseguradora.Tests.Support;
using Microsoft.Extensions.Options;

namespace Aseguradora.Tests.Security;

/// <summary>
/// The JWT issued by <see cref="JwtTokenService"/> takes its dates from the injected
/// <see cref="TimeProvider"/>, so expiration is testable without the real clock (US-F1-03).
/// </summary>
public class JwtTokenServiceTests
{
    private static readonly DateTimeOffset Emision = new(2026, 1, 2, 3, 4, 5, TimeSpan.Zero);
    private const int ExpiracionMinutos = 60;

    [Fact]
    public void CrearToken_UsaElRelojInyectadoParaLaEmisionYLaExpiracion()
    {
        var servicio = new JwtTokenService(Opciones(), new RelojFalso(Emision));
        var usuario = new UsuarioCuenta("usuario-1", "empleado@example.com");

        var emitido = servicio.CrearToken(usuario, Roles.Empleado);

        Assert.Equal(Emision.AddMinutes(ExpiracionMinutos), emitido.ExpiraEn);

        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(emitido.Token);
        Assert.Equal(Emision.UtcDateTime, jwt.ValidFrom);
        Assert.Equal(Emision.AddMinutes(ExpiracionMinutos).UtcDateTime, jwt.ValidTo);
        var rol = jwt.Claims.Single(claim => claim.Type == ClaimsAseguradora.Rol).Value;
        Assert.Equal(Roles.Empleado, rol);
    }

    [Fact]
    public void Constructor_ConRelojNulo_LanzaArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => new JwtTokenService(Opciones(), null!));
    }

    private static IOptions<JwtOpciones> Opciones() =>
        Options.Create(new JwtOpciones
        {
            Issuer = JwtOpciones.EmisorPredeterminado,
            Audience = JwtOpciones.AudienciaPredeterminada,
            Key = new string('k', JwtOpciones.LongitudMinimaClave),
            ExpiracionMinutos = ExpiracionMinutos
        });
}
