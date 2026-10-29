using Aseguradora.Application.Security;
using Aseguradora.Data;
using Aseguradora.Data.Identity;
using Aseguradora.Data.Seed;
using Microsoft.AspNetCore.Identity;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Aseguradora.Tests.Data;

public sealed class AdministradorInicialSeederTests : IDisposable
{
    private const string Email = "admin@example.com";
    private const string PasswordValida = "ChangeMe_Admin1!";

    private readonly SqliteConnection _connection = new("DataSource=:memory:");
    private readonly RegistroDeLogs<AdministradorInicialSeeder> _logger = new();

    public AdministradorInicialSeederTests()
    {
        _connection.Open();
        using var context = CrearContexto();
        context.Database.EnsureCreated();
    }

    public void Dispose()
    {
        _connection.Dispose();
    }

    [Fact]
    public async Task SembrarAsync_ConCredenciales_CreaElAdministradorConSuRol()
    {
        await using var services = CrearServicios(Email, PasswordValida);

        await SembrarAsync(services);

        await using var context = CrearContexto();
        var roles = await context.Roles.Select(rol => rol.Name).OrderBy(nombre => nombre).ToListAsync();
        Assert.Equal([Roles.Administrador, Roles.Empleado], roles);

        var usuario = await context.Users.SingleAsync();
        Assert.Equal(Email, usuario.Email);
        Assert.Equal(Email, usuario.UserName);
        Assert.Equal("Administrador", usuario.Nombre);
        Assert.Equal("Inicial", usuario.Apellido);

        var rolAdministrador = await context.Roles.SingleAsync(rol => rol.Name == Roles.Administrador);
        var asignacion = await context.UserRoles.SingleAsync();
        Assert.Equal(usuario.Id, asignacion.UserId);
        Assert.Equal(rolAdministrador.Id, asignacion.RoleId);
    }

    [Fact]
    public async Task SembrarAsync_DosArranquesSeguidos_NoDuplicaUsuarioNiRoles()
    {
        await using var services = CrearServicios(Email, PasswordValida);

        await SembrarAsync(services);
        await SembrarAsync(services);

        await using var context = CrearContexto();
        Assert.Equal(1, await context.Users.CountAsync());
        Assert.Equal(2, await context.Roles.CountAsync());
        Assert.Equal(1, await context.UserRoles.CountAsync());
    }

    [Fact]
    public async Task SembrarAsync_SinCredenciales_NoCreaNadaYRegistraUnWarning()
    {
        await using var services = CrearServicios(email: null, password: null);

        await SembrarAsync(services);

        await using var context = CrearContexto();
        Assert.Empty(await context.Users.ToListAsync());
        Assert.Contains(_logger.Entradas, entrada =>
            entrada.Nivel == LogLevel.Warning && entrada.Mensaje.Contains(AdministradorInicialSeeder.ClaveEmail));
    }

    [Fact]
    public async Task SembrarAsync_ConPasswordQueNoCumpleLaPolitica_NoRompeYRegistraUnError()
    {
        await using var services = CrearServicios(Email, password: "corta");

        await SembrarAsync(services);

        await using var context = CrearContexto();
        Assert.Empty(await context.Users.ToListAsync());
        Assert.Contains(_logger.Entradas, entrada => entrada.Nivel == LogLevel.Error);
    }

    private AseguradoraDbContext CrearContexto() =>
        new(new DbContextOptionsBuilder<AseguradoraDbContext>().UseSqlite(_connection).Options);

    private ServiceProvider CrearServicios(string? email, string? password)
    {
        var valores = new Dictionary<string, string?>();
        if (email is not null)
            valores[AdministradorInicialSeeder.ClaveEmail] = email;
        if (password is not null)
            valores[AdministradorInicialSeeder.ClavePassword] = password;

        var configuracion = new ConfigurationBuilder().AddInMemoryCollection(valores).Build();

        var services = new ServiceCollection()
            .AddSingleton<IConfiguration>(configuracion)
            .AddLogging()
            .AddSingleton<ILogger<AdministradorInicialSeeder>>(_logger)
            .AddDbContext<AseguradoraDbContext>(options => options.UseSqlite(_connection));

        services
            .AddIdentityCore<Usuario>()
            .AddRoles<IdentityRole>()
            .AddEntityFrameworkStores<AseguradoraDbContext>();
        services.AddScoped<ISeeder, AdministradorInicialSeeder>();

        return services.BuildServiceProvider();
    }

    private static async Task SembrarAsync(ServiceProvider services)
    {
        await using var scope = services.CreateAsyncScope();
        var seeder = scope.ServiceProvider.GetRequiredService<ISeeder>();
        await seeder.SembrarAsync(scope.ServiceProvider, CancellationToken.None);
    }

    private sealed class RegistroDeLogs<T> : ILogger<T>
    {
        public List<(LogLevel Nivel, string Mensaje)> Entradas { get; } = [];

        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;

        public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(
            LogLevel logLevel,
            EventId eventId,
            TState state,
            Exception? exception,
            Func<TState, Exception?, string> formatter) =>
            Entradas.Add((logLevel, formatter(state, exception)));
    }
}
