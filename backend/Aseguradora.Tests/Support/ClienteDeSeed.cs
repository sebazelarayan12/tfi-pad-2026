using Aseguradora.Data;
using Aseguradora.Data.Seed;
using Microsoft.EntityFrameworkCore;

namespace Aseguradora.Tests.Support;

/// <summary>
/// Frees the DNI and email of the seeded client so a test can register DNI 30123456, the only
/// adult person in the Renaper mock. The seeded client keeps its vehicle, policy and payments.
/// </summary>
public static class ClienteDeSeed
{
    /// <summary>Temporary DNI used to free the seeded one.</summary>
    public const string DniTemporal = "30000000";

    /// <summary>Temporary email used to free the seeded one.</summary>
    public const string EmailTemporal = "cliente.seed@example.com";

    /// <summary>Moves the seeded client to the temporary DNI and email.</summary>
    public static async Task LiberarAsync(AseguradoraDbContext context)
    {
        var cliente = await context.Clientes.SingleAsync(c => c.Id == SeedData.ClienteId);
        cliente.Dni = DniTemporal;
        cliente.Email = EmailTemporal;
        await context.SaveChangesAsync();
    }
}
