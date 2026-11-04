using System.Net;
using Aseguradora.Api.Security;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace Aseguradora.Tests.Security;

public sealed class ClientIpResolverTests
{
    private static readonly IPNetwork RedInterna = IPNetwork.Parse("10.0.0.0/8");

    private static DefaultHttpContext Contexto(string? remota, string? cfConnectingIp = null)
    {
        var contexto = new DefaultHttpContext();
        if (remota is not null)
            contexto.Connection.RemoteIpAddress = IPAddress.Parse(remota);
        if (cfConnectingIp is not null)
            contexto.Request.Headers[ClientIpResolver.CabeceraCloudflare] = cfConnectingIp;

        return contexto;
    }

    [Fact]
    public void RedConfiable_UsaCfConnectingIp()
    {
        var resolver = new ClientIpResolver([RedInterna]);

        var ip = resolver.ObtenerIp(Contexto("10.1.2.3", "203.0.113.9"));

        Assert.Equal("203.0.113.9", ip);
    }

    [Fact]
    public void RedNoConfiable_IgnoraCfConnectingIp()
    {
        var resolver = new ClientIpResolver([RedInterna]);

        var ip = resolver.ObtenerIp(Contexto("192.168.1.5", "203.0.113.9"));

        Assert.Equal("192.168.1.5", ip);
    }

    [Fact]
    public void SinIpRemota_UsaLaParticionDesconocida()
    {
        var resolver = new ClientIpResolver([RedInterna]);

        var ip = resolver.ObtenerIp(Contexto(remota: null, cfConnectingIp: "203.0.113.9"));

        Assert.Equal(ClientIpResolver.ParticionDesconocida, ip);
    }

    [Fact]
    public void RedConfiable_SinCabecera_UsaIpRemota()
    {
        var resolver = new ClientIpResolver([RedInterna]);

        var ip = resolver.ObtenerIp(Contexto("10.1.2.3"));

        Assert.Equal("10.1.2.3", ip);
    }

    [Fact]
    public void RedConfiable_ConCabeceraInvalida_UsaIpRemota()
    {
        var resolver = new ClientIpResolver([RedInterna]);

        var ip = resolver.ObtenerIp(Contexto("10.1.2.3", "no-es-una-ip"));

        Assert.Equal("10.1.2.3", ip);
    }

    [Fact]
    public void RedConfiable_Ipv4Mapeada_UsaCfConnectingIp()
    {
        var resolver = new ClientIpResolver([RedInterna]);

        var ip = resolver.ObtenerIp(Contexto("::ffff:10.1.2.3", "203.0.113.9"));

        Assert.Equal("203.0.113.9", ip);
    }

    [Fact]
    public void LeerRedesConfiables_LeeCidrEIgnoraVacios()
    {
        var configuracion = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ForwardedHeaders:RedesConfiables:0"] = "10.0.0.0/8",
                ["ForwardedHeaders:RedesConfiables:1"] = " ",
                ["ForwardedHeaders:RedesConfiables:2"] = "192.168.0.0/16"
            })
            .Build();

        var redes = ClientIpResolver.LeerRedesConfiables(configuracion);

        Assert.Equal(2, redes.Count);
        Assert.Contains(redes, red => red.Contains(IPAddress.Parse("10.1.2.3")));
        Assert.Contains(redes, red => red.Contains(IPAddress.Parse("192.168.1.5")));
    }

    [Fact]
    public void LeerRedesConfiables_ConCidrInvalido_Falla()
    {
        var configuracion = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ForwardedHeaders:RedesConfiables:0"] = "no-es-una-red"
            })
            .Build();

        Assert.Throws<InvalidOperationException>(() => ClientIpResolver.LeerRedesConfiables(configuracion));
    }
}
