using Aseguradora.Application.Dtos;
using Aseguradora.Application.Exceptions;
using Aseguradora.Application.External;
using Aseguradora.Application.Publico;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Domain.Interfaces;

namespace Aseguradora.Application.Services;

/// <summary>Cobro de cuotas en caja, inicio de pagos online y consultas de pagos y facturas.</summary>
public sealed class PagoService(
    IVerificadorPublico verificador,
    IRepository<Cuota> cuotas,
    IRepository<Cliente> clientes,
    IRepository<Pago> pagos,
    IPasarelaResolver pasarelas,
    IUnitOfWork unitOfWork,
    PagoOnlineOpciones opciones,
    TimeProvider reloj,
    IRepository<Poliza> polizas,
    IRepository<Factura> facturas,
    IAprobacionPagoService aprobacion,
    WebhookPagoService webhook) : IPagoService
{
    /// <summary>Pasarelas habilitadas para el pago online.</summary>
    public static readonly IReadOnlyList<string> ProveedoresValidos = ["pasarela1", "pasarela2"];

    private const string Moneda = "ARS";
    private const int IntentosNumeroUnico = 5;

    /// <inheritdoc />
    public async Task<PagoResponse> ConciliarAsync(Guid pagoId, CancellationToken ct = default)
    {
        var pago = await pagos.GetByIdAsync(pagoId, ct) ?? throw new NotFoundException("El pago no existe.");
        if (pago.Medio != MedioPago.Pasarela)
            throw new BusinessRuleException("Solo se pueden conciliar pagos de pasarela.");
        if (pago.Estado != EstadoPago.Pendiente)
            return await ObtenerPagoAsync(pagoId, ct);
        if (string.IsNullOrWhiteSpace(pago.IdExterno) || string.IsNullOrWhiteSpace(pago.Proveedor))
            throw new BusinessRuleException("El pago aún no tiene un identificador externo y proveedor para conciliar.");

        var respuesta = await pasarelas.Obtener(pago.Proveedor).ConsultarPagoAsync(pago.IdExterno, ct);
        if (respuesta.IdPago != pago.IdExterno
            || (respuesta.ReferenciaExterna is not null && respuesta.ReferenciaExterna != pago.Numero))
            throw new ExternalServiceException("La pasarela devolvió datos de otro pago.");
        var fecha = respuesta.Fecha.Kind == DateTimeKind.Unspecified
            ? DateTime.SpecifyKind(respuesta.Fecha, DateTimeKind.Utc)
            : respuesta.Fecha.ToUniversalTime();
        await webhook.AplicarResultadoAsync(pago, respuesta.Estado, respuesta.Importe, ct, new DateTimeOffset(fecha));
        return await ObtenerPagoAsync(pagoId, ct);
    }

    /// <summary>Cobra cuotas de un mismo cliente usando el circuito común de aprobación y facturación.</summary>
    public async Task<PagoResponse> RegistrarCajaAsync(PagoCajaRequest request, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        if (request.CuotaIds is null || request.CuotaIds.Count == 0)
            throw new BusinessRuleException("Debe indicar al menos una cuota.");
        var ids = request.CuotaIds.ToList();
        if (ids.Distinct().Count() != ids.Count)
            throw new BusinessRuleException("Las cuotas no pueden repetirse.");
        var seleccion = await cuotas.FindAsync(c => ids.Contains(c.Id), ct);
        if (seleccion.Count != ids.Count)
            throw new NotFoundException("Alguna de las cuotas indicadas no existe.");
        if (seleccion.Any(c => c.Estado is EstadoCuota.Anulada or EstadoCuota.Pagada))
            throw new BusinessRuleException("Solo se pueden pagar cuotas pendientes o vencidas (RN11).");
        var polizaIds = seleccion.Select(c => c.PolizaId).Distinct().ToList();
        var titulares = await polizas.FindAsync(p => polizaIds.Contains(p.Id), ct);
        if (titulares.Count != polizaIds.Count)
            throw new NotFoundException("Alguna de las pólizas indicadas no existe.");
        var clientesIds = titulares.Select(p => p.ClienteId).Distinct().ToList();
        if (clientesIds.Count != 1)
            throw new BusinessRuleException("Todas las cuotas deben pertenecer al mismo cliente.");
        var ahora = reloj.GetUtcNow().UtcDateTime;
        var pago = Pago.CrearPendiente(clientesIds[0], await GenerarNumeroAsync(ct), MedioPago.Caja, seleccion, ahora);
        await pagos.AddAsync(pago, ct);
        await aprobacion.AprobarAsync(pago, ahora, ct);
        return await ObtenerPagoAsync(pago.Id, ct);
    }

    public async Task<PagoResponse> ObtenerPagoAsync(Guid id, CancellationToken ct = default)
    {
        var pago = await pagos.GetByIdAsync(id, ct) ?? throw new NotFoundException("El pago no existe.");
        var factura = (await facturas.FindAsync(f => f.PagoId == id, ct)).SingleOrDefault();
        return new PagoResponse(pago.Id, pago.ClienteId, pago.Numero, pago.Estado switch
            {
                EstadoPago.Pendiente => ValoresPagoResponse.Pendiente,
                EstadoPago.Aprobado => ValoresPagoResponse.Aprobado,
                EstadoPago.Rechazado => ValoresPagoResponse.Rechazado,
                _ => throw new InvalidOperationException("Estado de pago desconocido.")
            }, pago.Medio switch
            {
                MedioPago.Caja => ValoresPagoResponse.Caja,
                MedioPago.Pasarela => ValoresPagoResponse.Pasarela,
                MedioPago.PagoFacil => ValoresPagoResponse.PagoFacil,
                _ => throw new InvalidOperationException("Medio de pago desconocido.")
            },
            pago.ImporteTotal, ComoUtc(pago.FechaCreacion),
            pago.FechaAcreditacion is { } fecha ? ComoUtc(fecha) : null,
            factura is null ? null : MapearFactura(factura));
    }

    public async Task<FacturaResponse> ObtenerFacturaAsync(Guid id, CancellationToken ct = default)
    {
        var factura = (await facturas.FindAsync(f => f.PagoId == id, ct)).SingleOrDefault()
            ?? throw new NotFoundException("No se encontró la factura del pago.");
        return MapearFactura(factura);
    }

    public async Task<FacturaResponse> ObtenerFacturaPublicaAsync(PublicoFacturaRequest request, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        var pago = await verificador.VerificarPagoAsync(request.Dni, request.NumeroPago, ct);
        var factura = (await facturas.FindAsync(f => f.PagoId == pago.Id, ct)).SingleOrDefault()
            ?? throw new NotFoundException(VerificadorPublico.MensajeNoEncontrado);
        return MapearFactura(factura);
    }

    private static FacturaResponse MapearFactura(Factura factura) => new(
        factura.Id, factura.PagoId, factura.Numero, factura.Tipo, factura.Importe,
        factura.Estado == EstadoFactura.PendienteCae ? ValoresPagoResponse.PendienteCae : ValoresPagoResponse.Autorizada,
        factura.Cae, factura.VencimientoCae, ComoUtc(factura.FechaEmision));

    // SQL Server datetime2 conserva los ticks UTC pero materializa DateTimeKind.Unspecified.
    private static DateTime ComoUtc(DateTime fecha) => fecha.Kind == DateTimeKind.Unspecified
        ? DateTime.SpecifyKind(fecha, DateTimeKind.Utc)
        : fecha.ToUniversalTime();

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
