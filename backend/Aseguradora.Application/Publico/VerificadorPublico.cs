using Aseguradora.Application.Exceptions;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Interfaces;

namespace Aseguradora.Application.Publico;

/// <summary>
/// Looks up the client by DNI and then the policy or payment by its number and client. A wrong DNI
/// and an unknown number produce the same <see cref="NotFoundException"/>, so the public web cannot
/// tell which of the two failed (RN20).
/// </summary>
public sealed class VerificadorPublico(
    IRepository<Cliente> clientes,
    IRepository<Poliza> polizas,
    IRepository<Pago> pagos) : IVerificadorPublico
{
    /// <summary>Single message for every failed check, so it never reveals which field was wrong.</summary>
    public const string MensajeNoEncontrado = "No se encontró un registro con los datos indicados.";

    /// <inheritdoc />
    public async Task<Poliza> VerificarPolizaAsync(string dni, string numeroPoliza, CancellationToken ct = default)
    {
        var clienteId = await BuscarClienteIdAsync(dni, ct);
        var numero = Normalizar(numeroPoliza);
        var poliza = (await polizas.FindAsync(p => p.Numero == numero && p.ClienteId == clienteId, ct))
            .SingleOrDefault();

        return poliza ?? throw new NotFoundException(MensajeNoEncontrado);
    }

    /// <inheritdoc />
    public async Task<Pago> VerificarPagoAsync(string dni, string numeroPago, CancellationToken ct = default)
    {
        var clienteId = await BuscarClienteIdAsync(dni, ct);
        var numero = Normalizar(numeroPago);
        var pago = (await pagos.FindAsync(p => p.Numero == numero && p.ClienteId == clienteId, ct))
            .SingleOrDefault();

        return pago ?? throw new NotFoundException(MensajeNoEncontrado);
    }

    private async Task<Guid> BuscarClienteIdAsync(string dni, CancellationToken ct)
    {
        var normalizado = Normalizar(dni);
        var cliente = (await clientes.FindAsync(c => c.Dni == normalizado, ct)).SingleOrDefault();
        return cliente?.Id ?? throw new NotFoundException(MensajeNoEncontrado);
    }

    private static string Normalizar(string? valor) => (valor ?? string.Empty).Trim();
}
