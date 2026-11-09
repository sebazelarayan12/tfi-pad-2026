using Aseguradora.Application.Exceptions;
using Aseguradora.Application.Security;
using Aseguradora.Application.Security.DTOs;
using Aseguradora.Tests.Support;

namespace Aseguradora.Tests.Application;

/// <summary>Editing and enabling or disabling accounts (PB-04), with a fake <see cref="IUsuarioStore"/>.</summary>
public class AutenticacionServiceUsuariosTests
{
    private const string EmailOtroAdmin = "otro-admin@example.com";

    private static (AutenticacionService Servicio, UsuarioStoreFalso Store) Crear()
    {
        var store = new UsuarioStoreFalso();
        return (new AutenticacionService(store, new TokenServiceFalso()), store);
    }

    [Fact]
    public async Task ActualizarUsuario_CambiaNombreApellidoYRol()
    {
        var (servicio, store) = Crear();
        var id = store.IdDe(UsuarioStoreFalso.EmailEmpleado);

        var resultado = await servicio.ActualizarUsuarioAsync(
            id, new ActualizarUsuarioRequest("  Ana ", "Gómez", Roles.Administrador));

        Assert.Equal("Ana", resultado.Nombre);
        Assert.Equal("Gómez", resultado.Apellido);
        Assert.Equal(Roles.Administrador, resultado.Rol);
        Assert.Equal(UsuarioStoreFalso.EmailEmpleado, resultado.Email);
    }

    [Fact]
    public async Task ActualizarUsuario_ConUsuarioInexistente_LanzaNotFound()
    {
        var (servicio, _) = Crear();

        await Assert.ThrowsAsync<NotFoundException>(() => servicio.ActualizarUsuarioAsync(
            "no-existe", new ActualizarUsuarioRequest("Ana", "Gómez", Roles.Empleado)));
    }

    [Fact]
    public async Task ActualizarUsuario_ConRolInvalido_LanzaReglaDeNegocio()
    {
        var (servicio, store) = Crear();

        await Assert.ThrowsAsync<BusinessRuleException>(() => servicio.ActualizarUsuarioAsync(
            store.IdDe(UsuarioStoreFalso.EmailEmpleado), new ActualizarUsuarioRequest("Ana", "Gómez", "Cliente")));
    }

    [Fact]
    public async Task ActualizarUsuario_NoPermiteQuitarElRolAlUltimoAdministradorActivo()
    {
        var (servicio, store) = Crear();
        var id = store.IdDe(UsuarioStoreFalso.EmailAdministrador);

        var error = await Assert.ThrowsAsync<BusinessRuleException>(() => servicio.ActualizarUsuarioAsync(
            id, new ActualizarUsuarioRequest("Ana", "Gómez", Roles.Empleado)));

        Assert.Contains("último administrador", error.Message);
        Assert.Equal(1, await store.ContarAdministradoresActivosAsync());
    }

    [Fact]
    public async Task ActualizarUsuario_ConOtroAdministradorActivo_PermiteBajarDeRol()
    {
        var (servicio, store) = Crear();
        store.Agregar(EmailOtroAdmin, Roles.Administrador, "Otro_Prueba1234!");

        var resultado = await servicio.ActualizarUsuarioAsync(
            store.IdDe(UsuarioStoreFalso.EmailAdministrador), new ActualizarUsuarioRequest("Ana", "Gómez", Roles.Empleado));

        Assert.Equal(Roles.Empleado, resultado.Rol);
    }

    [Fact]
    public async Task CambiarActivo_DesactivaYReactivaUnaCuenta()
    {
        var (servicio, store) = Crear();
        var admin = store.IdDe(UsuarioStoreFalso.EmailAdministrador);
        var empleado = store.IdDe(UsuarioStoreFalso.EmailEmpleado);

        var desactivada = await servicio.CambiarActivoAsync(empleado, admin, new CambiarActivoRequest(false));
        var reactivada = await servicio.CambiarActivoAsync(empleado, admin, new CambiarActivoRequest(true));

        Assert.False(desactivada.Activo);
        Assert.True(reactivada.Activo);
    }

    [Fact]
    public async Task CambiarActivo_NoPermiteDesactivarLaPropiaCuenta()
    {
        var (servicio, store) = Crear();
        store.Agregar(EmailOtroAdmin, Roles.Administrador, "Otro_Prueba1234!");
        var admin = store.IdDe(UsuarioStoreFalso.EmailAdministrador);

        var error = await Assert.ThrowsAsync<BusinessRuleException>(
            () => servicio.CambiarActivoAsync(admin, admin, new CambiarActivoRequest(false)));

        Assert.Contains("propia cuenta", error.Message);
    }

    [Fact]
    public async Task CambiarActivo_NoPermiteDesactivarAlUltimoAdministradorActivo()
    {
        var (servicio, store) = Crear();
        var admin = store.IdDe(UsuarioStoreFalso.EmailAdministrador);
        var otro = store.Agregar(EmailOtroAdmin, Roles.Administrador, "Otro_Prueba1234!");
        await servicio.CambiarActivoAsync(otro, admin, new CambiarActivoRequest(false));

        var error = await Assert.ThrowsAsync<BusinessRuleException>(
            () => servicio.CambiarActivoAsync(admin, otro, new CambiarActivoRequest(false)));

        Assert.Contains("último administrador", error.Message);
    }

    [Fact]
    public async Task CambiarActivo_ConUsuarioInexistente_LanzaNotFound()
    {
        var (servicio, store) = Crear();

        await Assert.ThrowsAsync<NotFoundException>(() => servicio.CambiarActivoAsync(
            "no-existe", store.IdDe(UsuarioStoreFalso.EmailAdministrador), new CambiarActivoRequest(false)));
    }

    [Fact]
    public async Task Login_ConCuentaDesactivada_FallaComoSiLaPasswordFueraIncorrecta()
    {
        var (servicio, store) = Crear();
        await servicio.CambiarActivoAsync(
            store.IdDe(UsuarioStoreFalso.EmailEmpleado),
            store.IdDe(UsuarioStoreFalso.EmailAdministrador),
            new CambiarActivoRequest(false));

        await Assert.ThrowsAsync<CredencialesInvalidasException>(() => servicio.LoginAsync(
            new LoginRequest(UsuarioStoreFalso.EmailEmpleado, UsuarioStoreFalso.PasswordEmpleado)));
    }

    [Fact]
    public async Task ObtenerYo_ConCuentaDesactivada_CierraLaSesion()
    {
        var (servicio, store) = Crear();
        var empleado = store.IdDe(UsuarioStoreFalso.EmailEmpleado);
        await servicio.CambiarActivoAsync(
            empleado, store.IdDe(UsuarioStoreFalso.EmailAdministrador), new CambiarActivoRequest(false));

        await Assert.ThrowsAsync<CredencialesInvalidasException>(() => servicio.ObtenerYoAsync(empleado));
    }
}
