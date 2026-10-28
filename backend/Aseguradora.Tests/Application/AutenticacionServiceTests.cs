using Aseguradora.Application.Exceptions;
using Aseguradora.Application.Security;
using Aseguradora.Application.Security.DTOs;
using Aseguradora.Tests.Support;

namespace Aseguradora.Tests.Application;

/// <summary>
/// Rules of CU01 and CU03 in <see cref="AutenticacionService"/>, with a fake
/// <see cref="IUsuarioStore"/> (US-F1-03).
/// </summary>
public class AutenticacionServiceTests
{
    [Fact]
    public async Task LoginAsync_ConCredencialesCorrectas_DevuelveTokenRolYExpiracion()
    {
        var store = new UsuarioStoreFalso();
        var tokens = new TokenServiceFalso();
        var servicio = new AutenticacionService(store, tokens);
        var solicitud = new LoginRequest(UsuarioStoreFalso.EmailAdministrador, UsuarioStoreFalso.PasswordAdministrador);

        var respuesta = await servicio.LoginAsync(solicitud);

        Assert.Equal($"{TokenServiceFalso.PrefijoToken}-{Roles.Administrador}", respuesta.Token);
        Assert.Equal(Roles.Administrador, respuesta.Rol);
        Assert.True(respuesta.ExpiraEn > DateTimeOffset.UtcNow);
        Assert.Equal(UsuarioStoreFalso.EmailAdministrador, tokens.UsuarioRecibido?.Email);
        Assert.Equal(Roles.Administrador, tokens.RolRecibido);
        Assert.Equal(UsuarioStoreFalso.EmailAdministrador, Assert.Single(store.Verificaciones).Email);
    }

    [Fact]
    public async Task LoginAsync_ConEmailInexistente_LanzaCredencialesInvalidas()
    {
        var servicio = new AutenticacionService(new UsuarioStoreFalso(), new TokenServiceFalso());
        var solicitud = new LoginRequest("no-existe@example.com", UsuarioStoreFalso.PasswordAdministrador);

        var excepcion = await Assert.ThrowsAsync<CredencialesInvalidasException>(
            () => servicio.LoginAsync(solicitud));

        Assert.Equal(CredencialesInvalidasException.Mensaje, excepcion.Message);
    }

    [Fact]
    public async Task LoginAsync_ConEmailInexistente_DelegaLaVerificacionDePassword()
    {
        var store = new UsuarioStoreFalso();
        var servicio = new AutenticacionService(store, new TokenServiceFalso());
        var solicitud = new LoginRequest("no-existe@example.com", "Password_Prueba1!");

        await Assert.ThrowsAsync<CredencialesInvalidasException>(
            () => servicio.LoginAsync(solicitud));

        var verificacion = Assert.Single(store.Verificaciones);
        Assert.Null(verificacion.Email);
        Assert.Equal(solicitud.Password, verificacion.Password);
    }

    [Fact]
    public async Task LoginAsync_ConPasswordIncorrecta_LanzaCredencialesInvalidasConElMismoMensaje()
    {
        var servicio = new AutenticacionService(new UsuarioStoreFalso(), new TokenServiceFalso());
        var solicitud = new LoginRequest(UsuarioStoreFalso.EmailAdministrador, "Password_Incorrecta1!");

        var excepcion = await Assert.ThrowsAsync<CredencialesInvalidasException>(
            () => servicio.LoginAsync(solicitud));

        Assert.Equal(CredencialesInvalidasException.Mensaje, excepcion.Message);
    }

    [Fact]
    public async Task CrearEmpleadoAsync_ConRolCliente_LanzaBusinessRuleYNoCrea()
    {
        var store = new UsuarioStoreFalso();
        var servicio = new AutenticacionService(store, new TokenServiceFalso());
        var solicitud = new CrearUsuarioRequest(
            "cliente@example.com",
            "Cliente_Prueba1!",
            "Cliente",
            "Cliente",
            "Prueba");

        var excepcion = await Assert.ThrowsAsync<BusinessRuleException>(
            () => servicio.CrearEmpleadoAsync(solicitud));

        Assert.Contains("Administrador o Empleado", excepcion.Message);
        Assert.Empty(store.Creaciones);
    }

    [Fact]
    public async Task CrearEmpleadoAsync_ConEmailDuplicado_LanzaBusinessRuleYNoCrea()
    {
        var store = new UsuarioStoreFalso();
        var servicio = new AutenticacionService(store, new TokenServiceFalso());
        var solicitud = new CrearUsuarioRequest(
            UsuarioStoreFalso.EmailAdministrador,
            "Otro_Empleado1!",
            Roles.Empleado,
            "Otro",
            "Empleado");

        var excepcion = await Assert.ThrowsAsync<BusinessRuleException>(
            () => servicio.CrearEmpleadoAsync(solicitud));

        Assert.Contains("ya está registrado", excepcion.Message);
        Assert.Empty(store.Creaciones);
    }

    [Fact]
    public void Constructor_ConDependenciaNula_LanzaArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new AutenticacionService(null!, new TokenServiceFalso()));
        Assert.Throws<ArgumentNullException>(
            () => new AutenticacionService(new UsuarioStoreFalso(), null!));
    }
}
