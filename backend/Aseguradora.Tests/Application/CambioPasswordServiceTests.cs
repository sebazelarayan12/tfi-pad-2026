using Aseguradora.Application.Exceptions;
using Aseguradora.Application.Security;
using Aseguradora.Application.Security.DTOs;
using Aseguradora.Tests.Support;

namespace Aseguradora.Tests.Application;

/// <summary>
/// Mandatory password change of US-F1-09 in <see cref="AutenticacionService"/>, with a fake
/// <see cref="IUsuarioStore"/>.
/// </summary>
public class CambioPasswordServiceTests
{
    private const string EmailPendiente = "nuevo@example.com";
    private const string PasswordTemporal = "Temporal_Prueba1!";
    private const string PasswordNueva = "Definitiva_Prueba1!";

    [Fact]
    public async Task LoginAsync_ConCuentaMarcada_InformaDebeCambiarPassword()
    {
        var (servicio, _) = Crear();

        var respuesta = await servicio.LoginAsync(new LoginRequest(EmailPendiente, PasswordTemporal));

        Assert.True(respuesta.DebeCambiarPassword);
    }

    [Fact]
    public async Task LoginAsync_ConCuentaNoMarcada_InformaFalse()
    {
        var (servicio, _) = Crear();

        var respuesta = await servicio.LoginAsync(
            new LoginRequest(UsuarioStoreFalso.EmailEmpleado, UsuarioStoreFalso.PasswordEmpleado));

        Assert.False(respuesta.DebeCambiarPassword);
    }

    [Fact]
    public async Task CrearEmpleadoAsync_CreaLaCuentaMarcadaParaCambiarLaPassword()
    {
        var (servicio, store) = Crear();

        await servicio.CrearEmpleadoAsync(new CrearUsuarioRequest(
            "otro@example.com", PasswordTemporal, Roles.Empleado, "Otro", "Empleado"));

        Assert.True(Assert.Single(store.Creaciones).DebeCambiarPassword);
    }

    [Fact]
    public async Task CambiarPasswordAsync_ConDatosCorrectos_CambiaLimpiaLaBanderaYEmiteTokenNuevo()
    {
        var (servicio, store) = Crear();

        var respuesta = await servicio.CambiarPasswordAsync(
            store.IdDe(EmailPendiente), new CambiarPasswordRequest(PasswordTemporal, PasswordNueva));

        Assert.False(respuesta.DebeCambiarPassword);
        Assert.Equal(Roles.Empleado, respuesta.Rol);
        Assert.Equal(PasswordNueva, store.PasswordDe(EmailPendiente));
        Assert.False(store.DebeCambiarDe(EmailPendiente));
    }

    [Fact]
    public async Task CambiarPasswordAsync_ConPasswordActualIncorrecta_LanzaBusinessRuleYNoCambiaLaBandera()
    {
        var (servicio, store) = Crear();

        await Assert.ThrowsAsync<BusinessRuleException>(() => servicio.CambiarPasswordAsync(
            store.IdDe(EmailPendiente), new CambiarPasswordRequest("Incorrecta_Prueba1!", PasswordNueva)));

        Assert.True(store.DebeCambiarDe(EmailPendiente));
        Assert.Equal(PasswordTemporal, store.PasswordDe(EmailPendiente));
    }

    [Fact]
    public async Task CambiarPasswordAsync_ConNuevaIgualALaActual_LanzaBusinessRule()
    {
        var (servicio, store) = Crear();

        var excepcion = await Assert.ThrowsAsync<BusinessRuleException>(() => servicio.CambiarPasswordAsync(
            store.IdDe(EmailPendiente), new CambiarPasswordRequest(PasswordTemporal, PasswordTemporal)));

        Assert.Equal("La contraseña nueva debe ser distinta de la actual.", excepcion.Message);
        Assert.True(store.DebeCambiarDe(EmailPendiente));
    }

    [Fact]
    public async Task CambiarPasswordAsync_ConNuevaDebil_LanzaBusinessRule()
    {
        var (servicio, store) = Crear();

        await Assert.ThrowsAsync<BusinessRuleException>(() => servicio.CambiarPasswordAsync(
            store.IdDe(EmailPendiente), new CambiarPasswordRequest(PasswordTemporal, "corta")));

        Assert.True(store.DebeCambiarDe(EmailPendiente));
    }

    [Fact]
    public async Task CambiarPasswordAsync_ConCuentaInexistente_LanzaCredencialesInvalidas()
    {
        var (servicio, _) = Crear();

        await Assert.ThrowsAsync<CredencialesInvalidasException>(() => servicio.CambiarPasswordAsync(
            "no-existe", new CambiarPasswordRequest(PasswordTemporal, PasswordNueva)));
    }

    private static (AutenticacionService Servicio, UsuarioStoreFalso Store) Crear()
    {
        var store = new UsuarioStoreFalso();
        store.Agregar(EmailPendiente, Roles.Empleado, PasswordTemporal, debeCambiarPassword: true);
        return (new AutenticacionService(store, new TokenServiceFalso()), store);
    }
}
