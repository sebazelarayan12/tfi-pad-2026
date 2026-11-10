using Aseguradora.Application.Exceptions;
using Aseguradora.Application.Grupos;
using Aseguradora.Application.Security;
using Aseguradora.Application.Security.DTOs;
using Aseguradora.Data;
using Aseguradora.Data.Repositories;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Tests.Data;
using Aseguradora.Tests.Support;

namespace Aseguradora.Tests.Grupos;

public sealed class GrupoExternoServiceTests : IDisposable
{
    private const string PasswordValida = "Clave-Segura-2026!";

    private readonly SqliteDbFixture _fixture = new();
    private readonly AseguradoraDbContext _db;
    private readonly TokenServiceFalso _tokens = new();
    private readonly GrupoExternoService _servicio;

    public GrupoExternoServiceTests()
    {
        _db = _fixture.CreateContext();
        _servicio = new GrupoExternoService(
            new EfRepository<GrupoExterno>(_db),
            new UnitOfWork(_db),
            new HasherFalso(),
            _tokens,
            new RelojFalso(new DateTimeOffset(2026, 11, 10, 12, 0, 0, TimeSpan.Zero)));
    }

    public void Dispose()
    {
        _db.Dispose();
        _fixture.Dispose();
    }

    private static RegistroGrupoRequest Registro(
        string email = "equipo@example.com",
        string nombre = "Estacionamiento Sur",
        string password = PasswordValida) =>
        new(email, password, nombre, "Ana Perez", "Consultar si un vehiculo tiene seguro vigente.");

    private async Task<Guid> RegistrarAsync(string email = "equipo@example.com", string nombre = "Estacionamiento Sur") =>
        (await _servicio.RegistrarAsync(Registro(email, nombre))).Id;

    private async Task<Guid> RegistrarAprobadoAsync()
    {
        var id = await RegistrarAsync();
        await _servicio.AprobarAsync(id);
        return id;
    }

    [Fact]
    public async Task Registrar_crea_la_solicitud_pendiente_sin_clave()
    {
        var cuenta = await _servicio.RegistrarAsync(Registro(email: "  Equipo@Example.com "));

        Assert.Equal(EstadoGrupo.Pendiente, cuenta.Estado);
        Assert.Equal("equipo@example.com", cuenta.Email);
        Assert.False(cuenta.TieneClave);
        var guardado = _db.GruposExternos.Single();
        Assert.Equal("hash:" + PasswordValida, guardado.PasswordHash);
        Assert.Equal(new DateTime(2026, 11, 10, 12, 0, 0, DateTimeKind.Utc), guardado.FechaSolicitud);
    }

    [Fact]
    public async Task Registrar_rechaza_un_email_ya_usado()
    {
        await RegistrarAsync();

        var ex = await Assert.ThrowsAsync<BusinessRuleException>(
            () => _servicio.RegistrarAsync(Registro(email: "EQUIPO@example.com", nombre: "Otro grupo")));

        Assert.Equal("El email ya está registrado.", ex.Message);
    }

    [Fact]
    public async Task Registrar_rechaza_un_nombre_ya_usado_sin_distinguir_mayusculas()
    {
        await RegistrarAsync();

        var ex = await Assert.ThrowsAsync<BusinessRuleException>(
            () => _servicio.RegistrarAsync(Registro(email: "otro@example.com", nombre: "ESTACIONAMIENTO SUR")));

        Assert.Equal("Ya existe un grupo con ese nombre.", ex.Message);
    }

    [Theory]
    [InlineData("corta1A!")]
    [InlineData("sinmayusculas-2026!")]
    [InlineData("SINMINUSCULAS-2026!")]
    [InlineData("SinNumeros-Seguros!")]
    [InlineData("SinSimbolos2026Abc")]
    public async Task Registrar_rechaza_una_contrasena_debil(string password)
    {
        var ex = await Assert.ThrowsAsync<BusinessRuleException>(
            () => _servicio.RegistrarAsync(Registro(password: password)));

        Assert.StartsWith("La contraseña debe tener", ex.Message);
    }

    [Fact]
    public async Task Login_con_credenciales_correctas_emite_un_token_de_rol_Grupo()
    {
        var id = await RegistrarAsync();

        var login = await _servicio.LoginAsync(new LoginRequest("equipo@example.com", PasswordValida));

        Assert.Equal(Roles.Grupo, login.Rol);
        Assert.Equal(Roles.Grupo, _tokens.RolRecibido);
        Assert.Equal(id.ToString(), _tokens.UsuarioRecibido!.Id);
    }

    [Fact]
    public async Task Login_permite_entrar_a_un_grupo_rechazado_para_ver_el_motivo()
    {
        var id = await RegistrarAsync();
        await _servicio.RechazarAsync(id, new MotivoRequest("Falta informacion del grupo."));

        var login = await _servicio.LoginAsync(new LoginRequest("equipo@example.com", PasswordValida));

        Assert.Equal(Roles.Grupo, login.Rol);
    }

    [Theory]
    [InlineData("equipo@example.com", "Otra-Clave-2026!")]
    [InlineData("nadie@example.com", PasswordValida)]
    public async Task Login_con_email_o_contrasena_incorrectos_falla_igual(string email, string password)
    {
        await RegistrarAsync();

        await Assert.ThrowsAsync<CredencialesInvalidasException>(
            () => _servicio.LoginAsync(new LoginRequest(email, password)));
    }

    [Fact]
    public async Task Aprobar_pasa_a_Aprobada_y_registra_la_fecha()
    {
        var id = await RegistrarAsync();

        var item = await _servicio.AprobarAsync(id);

        Assert.Equal(EstadoGrupo.Aprobada, item.Estado);
        Assert.Equal(new DateTime(2026, 11, 10, 12, 0, 0, DateTimeKind.Utc), item.FechaResolucion);
    }

    [Fact]
    public async Task Aprobar_un_grupo_ya_aprobado_falla()
    {
        var id = await RegistrarAprobadoAsync();

        await Assert.ThrowsAsync<BusinessRuleException>(() => _servicio.AprobarAsync(id));
    }

    [Fact]
    public async Task Rechazar_guarda_el_motivo_y_solo_vale_para_solicitudes_pendientes()
    {
        var id = await RegistrarAsync();

        var item = await _servicio.RechazarAsync(id, new MotivoRequest("No es un grupo de la materia."));

        Assert.Equal(EstadoGrupo.Rechazada, item.Estado);
        Assert.Equal("No es un grupo de la materia.", item.Motivo);
        await Assert.ThrowsAsync<BusinessRuleException>(
            () => _servicio.RechazarAsync(id, new MotivoRequest("Otra vez.")));
    }

    [Fact]
    public async Task Un_grupo_rechazado_se_puede_aprobar_despues()
    {
        var id = await RegistrarAsync();
        await _servicio.RechazarAsync(id, new MotivoRequest("Faltaba el contacto."));

        var item = await _servicio.AprobarAsync(id);

        Assert.Equal(EstadoGrupo.Aprobada, item.Estado);
        Assert.Null(item.Motivo);
    }

    [Fact]
    public async Task Generar_clave_exige_estar_aprobado()
    {
        var id = await RegistrarAsync();

        var ex = await Assert.ThrowsAsync<BusinessRuleException>(() => _servicio.GenerarClaveAsync(id));

        Assert.Equal("Tu solicitud todavía no está aprobada.", ex.Message);
    }

    [Fact]
    public async Task Generar_clave_devuelve_el_valor_una_vez_y_guarda_solo_el_hash()
    {
        var id = await RegistrarAprobadoAsync();

        var clave = await _servicio.GenerarClaveAsync(id);

        Assert.StartsWith(ClaveApi.Prefijo, clave.Clave);
        Assert.StartsWith(clave.Prefijo, clave.Clave);
        var guardado = _db.GruposExternos.Single();
        Assert.NotNull(guardado.ClaveHash);
        Assert.DoesNotContain(clave.Clave, guardado.ClaveHash);
        Assert.Equal(ClaveApi.Hash(clave.Clave), guardado.ClaveHash);
        var cuenta = await _servicio.ObtenerCuentaAsync(id);
        Assert.True(cuenta.TieneClave);
        Assert.Equal(clave.Prefijo, cuenta.ClavePrefijo);
    }

    [Fact]
    public async Task Regenerar_la_clave_invalida_la_anterior()
    {
        var id = await RegistrarAprobadoAsync();
        var primera = await _servicio.GenerarClaveAsync(id);

        var segunda = await _servicio.GenerarClaveAsync(id);

        Assert.NotEqual(primera.Clave, segunda.Clave);
        Assert.Null(await _servicio.ValidarClaveAsync(primera.Clave));
        Assert.NotNull(await _servicio.ValidarClaveAsync(segunda.Clave));
    }

    [Fact]
    public async Task Validar_clave_devuelve_el_grupo_aprobado()
    {
        var id = await RegistrarAprobadoAsync();
        var clave = await _servicio.GenerarClaveAsync(id);

        var grupo = await _servicio.ValidarClaveAsync(clave.Clave);

        Assert.NotNull(grupo);
        Assert.Equal(id, grupo.Id);
        Assert.Equal("Estacionamiento Sur", grupo.Nombre);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("nxk_clave-que-no-existe")]
    public async Task Validar_clave_desconocida_devuelve_null(string clave)
    {
        await RegistrarAprobadoAsync();

        Assert.Null(await _servicio.ValidarClaveAsync(clave));
    }

    [Fact]
    public async Task Revocar_borra_la_clave_y_deja_de_validar()
    {
        var id = await RegistrarAprobadoAsync();
        var clave = await _servicio.GenerarClaveAsync(id);

        var item = await _servicio.RevocarAsync(id, new MotivoRequest("Uso indebido."));

        Assert.Equal(EstadoGrupo.Revocada, item.Estado);
        Assert.Equal("Uso indebido.", item.Motivo);
        Assert.Null(_db.GruposExternos.Single().ClaveHash);
        Assert.Null(await _servicio.ValidarClaveAsync(clave.Clave));
    }

    [Fact]
    public async Task Revocar_solo_vale_para_grupos_aprobados()
    {
        var id = await RegistrarAsync();

        await Assert.ThrowsAsync<BusinessRuleException>(
            () => _servicio.RevocarAsync(id, new MotivoRequest("Motivo.")));
    }

    [Fact]
    public async Task Listar_filtra_por_estado_y_pagina_las_mas_nuevas_primero()
    {
        await RegistrarAsync("a@example.com", "Grupo A");
        var b = await RegistrarAsync("b@example.com", "Grupo B");
        await _servicio.AprobarAsync(b);

        var pendientes = await _servicio.ListarAsync(EstadoGrupo.Pendiente, 1, 10);
        var todos = await _servicio.ListarAsync(null, 1, 1);

        Assert.Equal(["Grupo A"], pendientes.Items.Select(i => i.Nombre));
        Assert.Equal(2, todos.Total);
        Assert.Single(todos.Items);
    }

    [Fact]
    public async Task Operar_sobre_un_grupo_inexistente_falla_con_NotFound()
    {
        await Assert.ThrowsAsync<NotFoundException>(() => _servicio.AprobarAsync(Guid.NewGuid()));
        await Assert.ThrowsAsync<NotFoundException>(() => _servicio.ObtenerCuentaAsync(Guid.NewGuid()));
    }

    private sealed class HasherFalso : IHasherPasswordGrupo
    {
        public string Hash(string password) => "hash:" + password;

        public bool Verificar(string hash, string password) => hash == "hash:" + password;
    }
}
