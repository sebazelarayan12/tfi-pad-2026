using System.Data;
using System.Security.Cryptography;
using System.Text;
using Aseguradora.Application.Services;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Aseguradora.Data.Repositories;

/// <summary>Serializa webhooks del mismo identificador incluso entre procesos, sin mantener una transacción fiscal abierta.</summary>
public sealed class ExclusionWebhookSql(AseguradoraDbContext db) : IExclusionWebhook
{
    /// <inheritdoc />
    public async Task<IAsyncDisposable> AdquirirAsync(string clave, CancellationToken ct)
    {
        var conexion = new SqlConnection(db.Database.GetConnectionString());
        try
        {
            await conexion.OpenAsync(ct);
            await using var comando = conexion.CreateCommand();
            comando.CommandText = "DECLARE @r int; EXEC @r = sys.sp_getapplock @Resource=@clave, @LockMode='Exclusive', @LockOwner='Session', @LockTimeout=15000; SELECT @r;";
            var recurso = "webhook:" + Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(clave.ToUpperInvariant())));
            comando.Parameters.Add("@clave", SqlDbType.NVarChar, 255).Value = recurso;
            var resultado = Convert.ToInt32(await comando.ExecuteScalarAsync(ct));
            if (resultado < 0) throw new TimeoutException("No se pudo adquirir la exclusión del webhook; reintente.");
            return new Bloqueo(conexion, recurso);
        }
        catch { await conexion.DisposeAsync(); throw; }
    }

    private sealed class Bloqueo(SqlConnection conexion, string recurso) : IAsyncDisposable
    {
        public async ValueTask DisposeAsync()
        {
            try
            {
                await using var comando = conexion.CreateCommand();
                comando.CommandText = "EXEC sys.sp_releaseapplock @Resource=@clave, @LockOwner='Session';";
                comando.Parameters.Add("@clave", SqlDbType.NVarChar, 255).Value = recurso;
                await comando.ExecuteNonQueryAsync(CancellationToken.None);
            }
            catch { SqlConnection.ClearPool(conexion); throw; }
            finally { await conexion.DisposeAsync(); }
        }
    }
}
