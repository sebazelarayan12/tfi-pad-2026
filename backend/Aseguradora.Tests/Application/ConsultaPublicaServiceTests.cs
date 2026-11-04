using System.Linq.Expressions;
using Aseguradora.Application.Exceptions;
using Aseguradora.Application.Publico;
using Aseguradora.Application.Publico.DTOs;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Domain.Interfaces;
using Aseguradora.Tests.Builders;

namespace Aseguradora.Tests.Application;

public sealed class ConsultaPublicaServiceTests
{
    private const string Dni = "30123456";
    private const string Numero = "POL-0000001";

    private static ConsultaPublicaService CreateService(
        IEnumerable<Cliente> clientes, IEnumerable<Poliza> polizas, IEnumerable<Vehiculo> vehiculos,
        IEnumerable<Plan> planes, IEnumerable<Cuota> cuotas) => new(
            new VerificadorPublico(
                new RepositorioEnMemoria<Cliente>(clientes),
                new RepositorioEnMemoria<Poliza>(polizas),
                new RepositorioEnMemoria<Pago>([])),
            new RepositorioEnMemoria<Vehiculo>(vehiculos),
            new RepositorioEnMemoria<Plan>(planes),
            new RepositorioEnMemoria<Cuota>(cuotas));

    private static (Cliente Cliente, Vehiculo Vehiculo, Plan Plan, Poliza Poliza) PolicyOf(
        EstadoPoliza estado, string dni = Dni, string numero = Numero)
    {
        var cliente = new ClienteBuilder().ConDni(dni).Construir();
        var vehiculo = new VehiculoBuilder().DeCliente(cliente).ConPatente("AB123CD").Construir();
        var plan = new PlanBuilder().Construir();
        var poliza = new PolizaBuilder().Para(cliente, vehiculo, plan)
            .Con(p =>
            {
                p.Numero = numero;
                p.Estado = estado;
            })
            .Construir();
        return (cliente, vehiculo, plan, poliza);
    }

    private static Cuota Installment(Poliza poliza, int numero, decimal importe, decimal recargo = 0m) =>
        new CuotaBuilder().DePoliza(poliza).Numero(numero)
            .Con(c =>
            {
                c.Importe = importe;
                c.Recargo = recargo;
                c.FechaVencimiento = poliza.FechaInicio.AddMonths(numero);
            })
            .Construir();

    private static ConsultaPublicaRequest Request(string dni = Dni, string numero = Numero) =>
        new() { Dni = dni, NumeroPoliza = numero };

    [Fact]
    public async Task Query_VigentePolicy_ReturnsStatusCoverageAndPlanAndVehicle()
    {
        var (cliente, vehiculo, plan, poliza) = PolicyOf(EstadoPoliza.Vigente);
        var servicio = CreateService([cliente], [poliza], [vehiculo], [plan], []);

        var respuesta = await servicio.ConsultarAsync(Request());

        Assert.Equal(Numero, respuesta.NumeroPoliza);
        Assert.Equal("VIGENTE", respuesta.Estado);
        Assert.True(respuesta.CoberturaVigente);
        Assert.Equal(poliza.FechaInicio, respuesta.VigenteDesde);
        Assert.Equal(poliza.FechaFin, respuesta.VigenteHasta);
        Assert.Equal(new PlanPublico(plan.Codigo, plan.Nombre), respuesta.Plan);
        Assert.Equal(new VehiculoPublico("AB123CD", vehiculo.Marca, vehiculo.Modelo, vehiculo.Anio), respuesta.Vehiculo);
    }

    [Theory]
    [InlineData(EstadoPoliza.Pendiente, "PENDIENTE")]
    [InlineData(EstadoPoliza.Suspendida, "SUSPENDIDA")]
    [InlineData(EstadoPoliza.Cancelada, "CANCELADA")]
    [InlineData(EstadoPoliza.Vencida, "VENCIDA")]
    public async Task Query_NonVigentePolicy_CoberturaVigenteIsFalse(EstadoPoliza estado, string estadoEsperado)
    {
        var (cliente, vehiculo, plan, poliza) = PolicyOf(estado);
        var servicio = CreateService([cliente], [poliza], [vehiculo], [plan], []);

        var respuesta = await servicio.ConsultarAsync(Request());

        Assert.False(respuesta.CoberturaVigente);
        Assert.Equal(estadoEsperado, respuesta.Estado);
    }

    [Fact]
    public async Task Query_InstallmentsOrderedByNumber_TotalIncludesSurcharge()
    {
        var (cliente, vehiculo, plan, poliza) = PolicyOf(EstadoPoliza.Vigente);
        var cuotas = new[]
        {
            Installment(poliza, 3, 2000m, 150m),
            Installment(poliza, 1, 2000m),
            Installment(poliza, 2, 2000m, 100m)
        };
        var servicio = CreateService([cliente], [poliza], [vehiculo], [plan], cuotas);

        var respuesta = await servicio.ConsultarAsync(Request());

        Assert.Equal([1, 2, 3], respuesta.Cuotas.Select(c => c.Numero));
        Assert.Equal(new CuotaPublica(cuotas[0].Id, 3, 2000m, 150m, 2150m, poliza.FechaInicio.AddMonths(3), "PENDIENTE"),
            respuesta.Cuotas[2]);
        Assert.Equal(2000m, respuesta.Cuotas[0].Total);
    }

    [Fact]
    public async Task Query_EachInstallmentCarriesItsIdSoTheWebCanPayIt()
    {
        var (cliente, vehiculo, plan, poliza) = PolicyOf(EstadoPoliza.Vigente);
        var cuotas = new[] { Installment(poliza, 1, 2000m), Installment(poliza, 2, 2000m) };
        var servicio = CreateService([cliente], [poliza], [vehiculo], [plan], cuotas);

        var respuesta = await servicio.ConsultarAsync(Request());

        Assert.Equal(cuotas.Select(c => c.Id), respuesta.Cuotas.Select(c => c.IdCuota));
    }

    [Fact]
    public async Task Query_OnlyIncludesInstallmentsOfThisPolicy()
    {
        var (cliente, vehiculo, plan, poliza) = PolicyOf(EstadoPoliza.Vigente);
        var otra = PolicyOf(EstadoPoliza.Vigente, numero: "POL-0000002").Poliza;
        var cuotas = new[] { Installment(poliza, 1, 2000m), Installment(otra, 1, 9999m), Installment(otra, 2, 9999m) };
        var servicio = CreateService([cliente], [poliza, otra], [vehiculo], [plan], cuotas);

        var respuesta = await servicio.ConsultarAsync(Request());

        Assert.Single(respuesta.Cuotas);
        Assert.Equal(2000m, respuesta.Cuotas[0].Importe);
    }

    [Fact]
    public async Task Query_ForeignDniOrUnknownNumber_ThrowsTheSameNotFound()
    {
        var (cliente, vehiculo, plan, poliza) = PolicyOf(EstadoPoliza.Vigente);
        var ajena = PolicyOf(EstadoPoliza.Vigente, dni: "99999999", numero: "POL-0000002");
        var servicio = CreateService(
            [cliente, ajena.Cliente], [poliza, ajena.Poliza], [vehiculo, ajena.Vehiculo], [plan], []);

        var dniAjeno = await Assert.ThrowsAsync<NotFoundException>(() =>
            servicio.ConsultarAsync(Request(dni: Dni, numero: "POL-0000002")));
        var inexistente = await Assert.ThrowsAsync<NotFoundException>(() =>
            servicio.ConsultarAsync(Request(numero: "POL-9999999")));

        Assert.Equal(VerificadorPublico.MensajeNoEncontrado, dniAjeno.Message);
        Assert.Equal(dniAjeno.Message, inexistente.Message);
    }

    /// <summary>In-memory repository: only the reads the service uses, no writes.</summary>
    private sealed class RepositorioEnMemoria<T>(IEnumerable<T> items) : IRepository<T> where T : EntityBase
    {
        private readonly List<T> _items = items.ToList();

        public Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
            Task.FromResult(_items.FirstOrDefault(i => i.Id == id));

        public Task<IReadOnlyList<T>> GetAllAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<T>>(_items.ToList());

        public Task<IReadOnlyList<T>> FindAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<T>>(_items.Where(predicate.Compile()).ToList());

        public Task<bool> AnyAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default) =>
            Task.FromResult(_items.Any(predicate.Compile()));

        public Task AddAsync(T entity, CancellationToken cancellationToken = default) => Task.CompletedTask;

        public void Update(T entity) => throw new NotSupportedException();

        public void Tocar(T entity) => throw new NotSupportedException();

        public void Remove(T entity) => throw new NotSupportedException();

        public IQueryable<T> Query() => _items.AsQueryable();
    }
}
