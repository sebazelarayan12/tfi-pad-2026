using Aseguradora.Tests.Fixtures;
using Aseguradora.Tests.Support;
using Microsoft.Extensions.Options;

namespace Aseguradora.Tests.Security;

/// <summary>
/// Jwt__Key is mandatory and must be long enough: the host refuses to start otherwise
/// (ValidateDataAnnotations + ValidateOnStart in AddSeguridad).
/// </summary>
public class OpcionesValidacionTests
{
    [Fact]
    public void Arranque_sin_Jwt_Key_falla()
    {
        using var factory = new AseguradoraWebFactory { UsarAutenticacionReal = true, ClaveJwt = null };

        var exception = Assert.Throws<OptionsValidationException>(() => factory.CreateClient());

        Assert.Contains("Jwt__Key", exception.Message);
    }

    [Fact]
    public void Arranque_con_Jwt_Key_corta_falla()
    {
        using var factory = new AseguradoraWebFactory
        {
            UsarAutenticacionReal = true,
            Ajustes = { ["Jwt:Key"] = new string('x', 31) }
        };

        var exception = Assert.Throws<OptionsValidationException>(() => factory.CreateClient());

        Assert.Contains("32", exception.Message);
    }

    [Fact]
    public void Arranque_con_Jwt_Key_valida_inicia()
    {
        using var factory = new AseguradoraWebFactory { UsarAutenticacionReal = true };

        using var client = factory.CreateClient();

        Assert.NotNull(client);
    }
}
