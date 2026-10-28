using Aseguradora.Api.Frentes.Frente1;
using Aseguradora.Api.Frentes.Frente2;
using Aseguradora.Api.Frentes.Frente3;
using Aseguradora.Api.Middleware;
using Aseguradora.Data;
using Aseguradora.Data.Seed;
using Aseguradora.Integrations;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Error responses without a body (401 and 403 from the auth middleware) become ProblemDetails.
builder.Services.AddProblemDetails();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
// Only the schemes are declared here; Frente 1 implements JWT and API key authentication.
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Description = "JWT for employees and administrators."
    });
    options.AddSecurityDefinition("ApiKey", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.ApiKey,
        In = ParameterLocation.Header,
        Name = "X-Api-Key",
        Description = "API key for external systems."
    });
});
builder.Services.AddHealthChecks().AddDbContextCheck<AseguradoraDbContext>();

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy => policy
        .WithOrigins(allowedOrigins)
        .AllowAnyHeader()
        .AllowAnyMethod()));

// Behind the Cloudflare Tunnel the API only sees cloudflared's address, so the real client IP
// is read from CF-Connecting-IP. Trusting it is safe only while the API is reachable solely
// through cloudflared (no public ports).
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedForHeaderName = "CF-Connecting-IP";
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

// The connection string comes from the ConnectionStrings__Default environment variable (.env), never from source.
var connectionString = builder.Configuration.GetConnectionString("Default")
    ?? throw new InvalidOperationException("Missing connection string: set ConnectionStrings__Default.");
builder.Services.AddData(connectionString);

// One line per front, in this order. Each owning task uncomments only its own line.
builder.Services.AddFrente1(builder.Configuration);
builder.Services.AddFrente2(builder.Configuration);
builder.Services.AddFrente3(builder.Configuration);
// builder.Services.AddFrente4(builder.Configuration);
builder.Services.AddIntegraciones(builder.Configuration);

var app = builder.Build();

// Development and local compose migrate on startup; production migrates manually with --migrar.
if (app.Configuration.GetValue<bool>("Migraciones:AplicarAlIniciar"))
{
    await using (var scope = app.Services.CreateAsyncScope())
    {
        await scope.ServiceProvider.GetRequiredService<AseguradoraDbContext>().Database.MigrateAsync();
    }
    await SeedData.EjecutarAsync(app.Services);
}

app.UseForwardedHeaders();
app.UseMiddleware<ExceptionMiddleware>();
app.UseStatusCodePages();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();

    // In containers TLS ends at Cloudflare and the API only speaks plain HTTP.
    app.UseHttpsRedirection();
}

app.UseCors();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
// Anonymous on purpose: Docker and the tunnel probe it without credentials.
app.MapHealthChecks("/health").AllowAnonymous();

app.Run();

// Lets WebApplicationFactory<Program> host the API in integration tests.
public partial class Program { }
