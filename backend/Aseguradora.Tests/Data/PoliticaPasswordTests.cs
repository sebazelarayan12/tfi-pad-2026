using Aseguradora.Application.Exceptions;
using Aseguradora.Application.Security;
using Aseguradora.Data;
using Aseguradora.Data.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Aseguradora.Tests.Data;

/// <summary>
/// Strong password policy and the "must change" flag of US-F1-09, over the real Identity stack and
/// SQLite: one case per rule, the flag on create and change, and the example seed password.
/// </summary>
public sealed class PoliticaPasswordTests : IDisposable
{
    private const string PasswordValida = "Valida_Prueba12!";

    private readonly SqliteConnection _connection = new("DataSource=:memory:");
    private readonly ServiceProvider _services;

    public PoliticaPasswordTests()
    {
        _connection.Open();

        var services = new ServiceCollection()
            .AddDbContext<AseguradoraDbContext>(options => options.UseSqlite(_connection));
        services.AddIdentityAseguradora();
        _services = services.BuildServiceProvider();

        using var scope = _services.CreateScope();
        scope.ServiceProvider.GetRequiredService<AseguradoraDbContext>().Database.EnsureCreated();
        scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>()
            .CreateAsync(new IdentityRole(Roles.Empleado)).GetAwaiter().GetResult();
    }

    public void Dispose()
    {
        _services.Dispose();
        _connection.Dispose();
    }

    [Theory]
    [InlineData("Corta_1!a", "al menos 12 caracteres")]
    [InlineData("sin_mayuscula_12!", "mayúscula")]
    [InlineData("SIN_MINUSCULA_12!", "minúscula")]
    [InlineData("Sin_Digito_Aqui!", "dígito")]
    [InlineData("SinSimbolo12345", "no alfanumérico")]
    public async Task CrearAsync_ConPasswordQueIncumpleUnaRegla_LanzaBusinessRule(string password, string fragmento)
    {
        await using var scope = _services.CreateAsyncScope();
        var store = new IdentityUsuarioStore(scope.ServiceProvider.GetRequiredService<UserManager<Usuario>>());

        var excepcion = await Assert.ThrowsAsync<BusinessRuleException>(
            () => store.CrearAsync("nuevo@example.com", password, Roles.Empleado, "Nuevo", "Empleado"));

        Assert.Contains(fragmento, excepcion.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task CrearAsync_ConPasswordValida_NaceMarcadaSoloSiSePide()
    {
        await using var scope = _services.CreateAsyncScope();
        var store = new IdentityUsuarioStore(scope.ServiceProvider.GetRequiredService<UserManager<Usuario>>());

        var marcada = await store.CrearAsync(
            "marcada@example.com", PasswordValida, Roles.Empleado, "Marcada", "Prueba", debeCambiarPassword: true);
        var libre = await store.CrearAsync(
            "libre@example.com", PasswordValida, Roles.Empleado, "Libre", "Prueba");

        Assert.True(marcada.DebeCambiarPassword);
        Assert.False(libre.DebeCambiarPassword);
    }

    [Fact]
    public async Task CambiarPasswordAsync_ConDatosValidos_LimpiaLaBanderaYLaNuevaPasswordSirve()
    {
        await using var scope = _services.CreateAsyncScope();
        var store = new IdentityUsuarioStore(scope.ServiceProvider.GetRequiredService<UserManager<Usuario>>());
        var cuenta = await store.CrearAsync(
            "marcada@example.com", PasswordValida, Roles.Empleado, "Marcada", "Prueba", debeCambiarPassword: true);

        await store.CambiarPasswordAsync(cuenta.Id, PasswordValida, "Definitiva_Prueba12!");

        var actualizada = await store.BuscarPorIdAsync(cuenta.Id);
        Assert.False(actualizada!.DebeCambiarPassword);
        Assert.True(await store.VerificarPasswordAsync(actualizada, "Definitiva_Prueba12!"));
        Assert.False(await store.VerificarPasswordAsync(actualizada, PasswordValida));
    }

    [Fact]
    public async Task CambiarPasswordAsync_ConActualIncorrecta_LanzaBusinessRuleYConservaLaBandera()
    {
        await using var scope = _services.CreateAsyncScope();
        var store = new IdentityUsuarioStore(scope.ServiceProvider.GetRequiredService<UserManager<Usuario>>());
        var cuenta = await store.CrearAsync(
            "marcada@example.com", PasswordValida, Roles.Empleado, "Marcada", "Prueba", debeCambiarPassword: true);

        await Assert.ThrowsAsync<BusinessRuleException>(
            () => store.CambiarPasswordAsync(cuenta.Id, "Incorrecta_Prueba12!", "Definitiva_Prueba12!"));

        Assert.True((await store.BuscarPorIdAsync(cuenta.Id))!.DebeCambiarPassword);
    }

    [Fact]
    public async Task CambiarPasswordAsync_ConNuevaDebil_LanzaBusinessRuleYConservaLaBandera()
    {
        await using var scope = _services.CreateAsyncScope();
        var store = new IdentityUsuarioStore(scope.ServiceProvider.GetRequiredService<UserManager<Usuario>>());
        var cuenta = await store.CrearAsync(
            "marcada@example.com", PasswordValida, Roles.Empleado, "Marcada", "Prueba", debeCambiarPassword: true);

        await Assert.ThrowsAsync<BusinessRuleException>(
            () => store.CambiarPasswordAsync(cuenta.Id, PasswordValida, "corta"));

        Assert.True((await store.BuscarPorIdAsync(cuenta.Id))!.DebeCambiarPassword);
    }

    [Fact]
    public async Task PasswordDeEjemploDelEnvExample_CumpleLaPolitica()
    {
        var ruta = BuscarArchivoHaciaArriba(".env.example");
        var linea = File.ReadLines(ruta).Single(l => l.StartsWith("SEED_ADMINISTRADOR_PASSWORD=", StringComparison.Ordinal));
        var password = linea["SEED_ADMINISTRADOR_PASSWORD=".Length..].Trim();

        await using var scope = _services.CreateAsyncScope();
        var usuarios = scope.ServiceProvider.GetRequiredService<UserManager<Usuario>>();
        var resultado = await usuarios.CreateAsync(
            new Usuario { UserName = "seed@example.com", Email = "seed@example.com" }, password);

        Assert.True(resultado.Succeeded, string.Join(" ", resultado.Errors.Select(e => e.Description)));
    }

    private static string BuscarArchivoHaciaArriba(string nombre)
    {
        var directorio = new DirectoryInfo(AppContext.BaseDirectory);
        while (directorio is not null)
        {
            var candidato = Path.Combine(directorio.FullName, nombre);
            if (File.Exists(candidato))
                return candidato;
            directorio = directorio.Parent;
        }

        throw new FileNotFoundException($"No se encontró {nombre} desde {AppContext.BaseDirectory}.");
    }
}
