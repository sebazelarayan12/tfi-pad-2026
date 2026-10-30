using Aseguradora.Application.Dtos;
using Aseguradora.Application.Exceptions;
using Aseguradora.Application.External;
using Aseguradora.Application.Publico;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Domain.Interfaces;

namespace Aseguradora.Application.Services;

/// <summary>Inicia pagos online de cuotas con una pasarela (CU15, RN11, RN20).</summary>
public sealed class PagoService(
    IVerificadorPublico verificador,
    IRepository<Cuota> cuotas,
    IRepository<Cliente> clientes,
    IRepository<Pago> pagos,
    IPasarelaResolver pasarelas,
    IUnitOfWork unitOfWork,
    PagoOnlineOpciones opciones,
    TimeProvider reloj) : IPagoService
{
    /// <summary>Pasarelas habilitadas para el pago online.</summary>
    public static readonly IReadOnlyList<string> ProveedoresValidos = ["pasarela1", "pasarela2"];

    private const string Moneda = "ARS";
    private const int IntentosNumeroUnico = 5;

    /// <inheritdoc />
    public async Task<PagoPublicoResponse> IniciarPagoOnlineAsync(PagoPublicoRequest request, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var proveedor = request.Proveedor.Trim().ToLowerInvariant();
        if (!ProveedoresValidos.Contains(proveedor))
            throw new BusinessRuleException("El proveedor de pago indicado no existe.");

        var poliza = await verificador.VerificarPolizaAsync(request.Dni, request.NumeroPoliza, ct);
        var cuotasAPagar = await CargarCuotasPagablesAsync(poliza, request.CuotaIds, ct);
        var ahora = reloj.GetUtcNow().UtcDateTime;
        await ExigirSinPagoEnCursoAsync(request.CuotaIds, ahora, ct);

        var cliente = await clientes.GetByIdAsync(poliza.ClienteId, ct)
            ?? throw new NotFoundException(VerificadorPublico.MensajeNoEncontrado);

        var pago = Pago.CrearPendiente(
            cliente.Id, await GenerarNumeroAsync(ct), MedioPago.Pasarela, cuotasAPagar, ahora, proveedor);
        await pagos.AddAsync(pago, ct);
        // The C8 check above and this insert are not atomic. Touching the installments renews their
        // RowVersion in the same save, so a concurrent request that read them first fails with a conflict.
        foreach (var cuota in cuotasAPagar)
            cuotas.Tocar(cuota);
        await unitOfWork.SaveChangesAsync(ct);

        var respuesta = await CrearEnPasarelaAsync(pago, poliza, cliente, proveedor, ct);

        pago.IdExterno = respuesta.IdPago;
        pago.LinkPago = respuesta.UrlPago;
        // The gateway already holds the checkout, so a client that disconnects now must not leave the
        // payment without its IdExterno and LinkPago.
        await unitOfWork.SaveChangesAsync(CancellationToken.None);

        return new PagoPublicoResponse(pago.Numero, pago.Id, respuesta.UrlPago, respuesta.FechaExpiracion);
    }

    private async Task<List<Cuota>> CargarCuotasPagablesAsync(Poliza poliza, List<Guid> cuotaIds, CancellationToken ct)
    {
        if (cuotaIds.Distinct().Count() != cuotaIds.Count)
            throw new BusinessRuleException("Las cuotas no pueden repetirse.");

        var encontradas = (await cuotas.FindAsync(c => cuotaIds.Contains(c.Id), ct)).ToList();
        if (encontradas.Count != cuotaIds.Count || encontradas.Any(c => c.PolizaId != poliza.Id))
            throw new BusinessRuleException("Todas las cuotas deben pertenecer a la póliza indicada.");
        if (encontradas.Any(c => c.Estado is not (EstadoCuota.Pendiente or EstadoCuota.Vencida)))
            throw new BusinessRuleException("Solo se pueden pagar cuotas pendientes o vencidas (RN11).");

        return encontradas;
    }

    // C8: a Pendiente payment created inside the reservation window still may be paid, so a second one
    // for the same installment would risk charging it twice.
    private async Task ExigirSinPagoEnCursoAsync(List<Guid> cuotaIds, DateTime ahora, CancellationToken ct)
    {
        var inicioReserva = ahora.AddMinutes(-opciones.ReservaMinutos);
        var enCurso = await pagos.AnyAsync(
            p => p.Estado == EstadoPago.Pendiente
                && p.FechaCreacion > inicioReserva
                && p.PagoCuotas.Any(pc => cuotaIds.Contains(pc.CuotaId)),
            ct);

        if (enCurso)
            throw new BusinessRuleException("Alguna de las cuotas ya tiene un pago en curso. Intente de nuevo más tarde.");
    }

    private async Task<PasarelaCrearPagoResponse> CrearEnPasarelaAsync(
        Pago pago, Poliza poliza, Cliente cliente, string proveedor, CancellationToken ct)
    {
        var pedido = new PasarelaCrearPagoRequest(
            pago.Numero,
            pago.ImporteTotal,
            Moneda,
            $"Cuotas de la póliza {poliza.Numero}",
            new PasarelaPagador($"{cliente.Nombre} {cliente.Apellido}", cliente.Dni, cliente.Email),
            opciones.UrlRetornoExito,
            opciones.UrlRetornoError,
            $"{opciones.UrlBaseApi.TrimEnd('/')}/api/webhooks/pasarela/{proveedor}");

        try
        {
            return await pasarelas.Obtener(proveedor).CrearPagoAsync(pedido, ct);
        }
        catch (Exception ex) when (ex is ExternalServiceException or OperationCanceledException)
        {
            // The installments stay as they were; only the payment is closed. CancellationToken.None so a
            // client that disconnects cannot leave the payment Pendiente and blocking the installments.
            pago.Rechazar();
            await unitOfWork.SaveChangesAsync(CancellationToken.None);
            throw;
        }
    }

    // PAG- plus six hex digits. The unique index on Numero is the last guard against a race.
    private async Task<string> GenerarNumeroAsync(CancellationToken ct)
    {
        for (var intento = 0; intento < IntentosNumeroUnico; intento++)
        {
            var numero = $"PAG-{Guid.NewGuid():N}"[..10];
            if (!await pagos.AnyAsync(p => p.Numero == numero, ct))
                return numero;
        }

        throw new InvalidOperationException("No se pudo generar un número de pago único.");
    }
}
