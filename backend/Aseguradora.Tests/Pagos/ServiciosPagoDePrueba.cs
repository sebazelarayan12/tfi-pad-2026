using Aseguradora.Application.Publico;
using Aseguradora.Application.External;
using Aseguradora.Application.Services;
using Aseguradora.Data;
using Aseguradora.Data.Repositories;
using Aseguradora.Data.Seed;
using Aseguradora.Domain.Entities;
using Microsoft.Extensions.Logging.Abstractions;

namespace Aseguradora.Tests.Pagos;

internal static class ServiciosPagoDePrueba
{
    public static void AgregarFacturaSeed(AseguradoraDbContext db)
    {
        var pago = db.Pagos.Find(SeedData.PagoId)!;
        var factura = Factura.CrearPendienteCae(pago, pago.FechaCreacion);
        factura.Autorizar("0001-00000001", "74123456789012", new DateOnly(2026, 11, 10));
        db.Facturas.Add(factura);
        db.SaveChanges();
    }

    public static AprobacionPagoService CrearAprobacion(AseguradoraDbContext db, bool fallaArca = false)
    {
        var cuotas = new EfRepository<Cuota>(db);
        var polizas = new EfRepository<Poliza>(db);
        var facturas = new EfRepository<Factura>(db);
        var uow = new UnitOfWork(db);
        var facturacion = new FacturacionService(new EfRepository<Pago>(db), cuotas, polizas,
            new EfRepository<Cliente>(db), facturas, uow, new CobroTestContext.ArcaFake { Fallar = fallaArca },
            new FacturacionOpciones("30712345678", 1), TimeProvider.System,
            NullLogger<FacturacionService>.Instance);
        return new AprobacionPagoService(cuotas, polizas, uow, new ActualizadorEstadoPoliza(polizas, cuotas),
            facturacion, NullLogger<AprobacionPagoService>.Instance, facturas);
    }

    public static PagoService Crear(AseguradoraDbContext db, IVerificadorPublico? verificador = null, bool fallaArca = false) =>
        new(verificador ?? new VerificadorPublico(new EfRepository<Cliente>(db), new EfRepository<Poliza>(db), new EfRepository<Pago>(db)),
            new EfRepository<Cuota>(db), new EfRepository<Cliente>(db), new EfRepository<Pago>(db),
            new PasarelaNoUtilizada(), new UnitOfWork(db), new PagoOnlineOpciones { ReservaMinutos = 60 }, TimeProvider.System,
            new EfRepository<Poliza>(db), new EfRepository<Factura>(db), CrearAprobacion(db, fallaArca));

    private sealed class PasarelaNoUtilizada : IPasarelaResolver
    {
        public IPasarelaService Obtener(string proveedor) => throw new NotSupportedException("Caja no usa pasarelas.");
    }
}
