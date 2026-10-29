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
/// <see cref="IdentityUsuarioStore"/> over the real Identity stack and SQLite: Spanish error
/// messages and password verification, including the dummy hash of an unknown email
/// (US-F1-03).
/// </summary>
public sealed class IdentityUsuarioStoreTests : IDisposable
{
    private const string PasswordValida = "Empleado_Prueba1!";

    private readonly SqliteConnection _connection = new("DataSource=:memory:");
    private readonly ServiceProvider _services;

    public IdentityUsuarioStoreTests()
    {
        _connection.Open();

        var services = new ServiceCollection()
            .AddDbContext<AseguradoraDbContext>(options => options.UseSqlite(_connection));
        services.AddIdentityAseguradora();
        services.AddScoped<PasswordHasherEspia>();
        services.AddScoped<IPasswordHasher<Usuario>>(
            provider => provider.GetRequiredService<PasswordHasherEspia>());
        _services = services.BuildServiceProvider();

        using var scope = _services.CreateScope();
        scope.ServiceProvider.GetRequiredService<AseguradoraDbContext>().Database.EnsureCreated();
    }

    public void Dispose()
    {
        _services.Dispose();
        _connection.Dispose();
    }

    [Fact]
    public async Task CrearAsync_ConPasswordQueNoCumpleLaPolitica_LanzaBusinessRuleEnEspanol()
    {
        await using var scope = _services.CreateAsyncScope();
        var store = CrearStore(scope.ServiceProvider);

        var excepcion = await Assert.ThrowsAsync<BusinessRuleException>(() =>
            store.CrearAsync("nuevo@example.com", "corta", Roles.Empleado, "Nuevo", "Empleado"));

        Assert.Contains("contraseña", excepcion.Message, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("Passwords must", excepcion.Message);
    }

    [Fact]
    public async Task VerificarPasswordAsync_ConUsuarioInexistente_VerificaElHashFicticio()
    {
        await using var scope = _services.CreateAsyncScope();
        var store = CrearStore(scope.ServiceProvider);
        var hasher = scope.ServiceProvider.GetRequiredService<PasswordHasherEspia>();

        Assert.False(await store.VerificarPasswordAsync(null, PasswordValida));
        Assert.Equal(1, hasher.Verificaciones);
    }

    [Fact]
    public async Task CrearAsync_ConDatosValidos_VerificaLaPasswordCreada()
    {
        await using var scope = _services.CreateAsyncScope();
        var store = CrearStore(scope.ServiceProvider);

        var creado = await store.CrearAsync(
            "empleado@example.com",
            PasswordValida,
            Roles.Empleado,
            "Empleado",
            "Prueba");

        Assert.True(await store.VerificarPasswordAsync(creado, PasswordValida));
        Assert.False(await store.VerificarPasswordAsync(creado, "Otra_Password1!"));
    }

    private static IdentityUsuarioStore CrearStore(IServiceProvider services) =>
        new(services.GetRequiredService<UserManager<Usuario>>());

    private sealed class PasswordHasherEspia : IPasswordHasher<Usuario>
    {
        private readonly PasswordHasher<Usuario> _real = new();

        public int Verificaciones { get; private set; }

        public string HashPassword(Usuario user, string password) =>
            _real.HashPassword(user, password);

        public PasswordVerificationResult VerifyHashedPassword(
            Usuario user,
            string hashedPassword,
            string providedPassword)
        {
            Verificaciones++;
            return _real.VerifyHashedPassword(user, hashedPassword, providedPassword);
        }
    }
}
