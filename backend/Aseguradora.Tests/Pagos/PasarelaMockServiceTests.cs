using Aseguradora.Application.Dtos;
using Aseguradora.Application.External;
using Aseguradora.Application.Exceptions;
using Aseguradora.Integrations.Arca;
using Aseguradora.Integrations.Pasarela;
using Aseguradora.Integrations.Pagos;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
namespace Aseguradora.Tests.Pagos;
public class PasarelaMockServiceTests
{
    private sealed class RelojFijo : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => new(2026, 11, 8, 14, 0, 0, TimeSpan.Zero);
    }

    [Fact]
    public async Task CrearYConsultarConservaEstadoYUsaRelojInyectado()
    {
        var reloj = new RelojFijo();
        var mock = new PasarelaMockService("pasarela1", reloj);
        var creado = await mock.CrearPagoAsync(new("PAG-1", 51250m, "ARS", "Cuotas",
            new("Cliente", "30123456", "test@example.com"), "https://example.com/exito",
            "https://example.com/error", "https://example.com/webhook"), default);
        var consultado = await mock.ConsultarPagoAsync(creado.IdPago, default);
        Assert.Equal("PSR-PAG-1", creado.IdPago);
        Assert.Equal(creado.Estado, consultado.Estado);
        Assert.Equal("PENDIENTE", consultado.Estado);
        Assert.Equal(51250m, consultado.Importe);
        Assert.Equal(reloj.GetUtcNow().UtcDateTime.AddHours(1), creado.FechaExpiracion);
        Assert.Equal(reloj.GetUtcNow().UtcDateTime, consultado.Fecha);
        Assert.True(Uri.IsWellFormedUriString(creado.UrlPago, UriKind.Absolute));
    }

    [Fact]
    public void ConstructorRechazaRelojNulo()
        => Assert.Throws<ArgumentNullException>(() => new PasarelaMockService("pasarela1", null!));
}
