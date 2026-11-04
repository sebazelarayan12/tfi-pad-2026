using System.Linq.Expressions;
using Aseguradora.Application.Exceptions;
using Aseguradora.Application.Services;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Domain.Interfaces;
using Aseguradora.Tests.Builders;

namespace Aseguradora.Tests.Application;

public class ActualizadorEstadoPolizaTests
{
    private sealed class RepositorioEnMemoria<T> : IRepository<T> where T : EntityBase
    {
        private readonly List<T> _items;

        public RepositorioEnMemoria(IEnumerable<T> items) => _items = items.ToList();

        public int Escrituras { get; private set; }

        public Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
            Task.FromResult(_items.FirstOrDefault(i => i.Id == id));

        public Task<IReadOnlyList<T>> GetAllAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<T>>(_items.ToList());

        public Task<IReadOnlyList<T>> FindAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<T>>(_items.Where(predicate.Compile()).ToList());

        public Task<bool> AnyAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default) =>
            Task.FromResult(_items.Any(predicate.Compile()));

        public Task AddAsync(T entity, CancellationToken cancellationToken = default)
        {
            Escrituras++;
            return Task.CompletedTask;
        }

        public void Update(T entity) => Escrituras++;

        public void Tocar(T entity) => Escrituras++;

        public void Remove(T entity) => Escrituras++;

        public IQueryable<T> Query() => _items.AsQueryable();
    }

    private static Cuota Cuota(Poliza poliza, int numero, EstadoCuota estado) =>
        new CuotaBuilder().DePoliza(poliza).Numero(numero).Con(c => c.Estado = estado).Construir();

    [Fact]
    public async Task ReevaluarAsync_PolizaInexistente_LanzaNotFound()
    {
        var actualizador = new ActualizadorEstadoPoliza(
            new RepositorioEnMemoria<Poliza>([]), new RepositorioEnMemoria<Cuota>([]));

        await Assert.ThrowsAsync<NotFoundException>(() => actualizador.ReevaluarAsync(Guid.NewGuid(), CancellationToken.None));
    }

    [Fact]
    public async Task ReevaluarAsync_LlamaReevaluarEstadoConLasCuotasDeLaPoliza()
    {
        var poliza = new PolizaBuilder().Con(p => p.Estado = EstadoPoliza.Pendiente).Construir();
        var ajena = new PolizaBuilder().Construir();
        // Only the installments of this policy count: the first one of another policy is paid but irrelevant.
        var cuotas = new[]
        {
            Cuota(poliza, 1, EstadoCuota.Pagada),
            Cuota(poliza, 2, EstadoCuota.Pendiente),
            Cuota(ajena, 1, EstadoCuota.Pagada)
        };
        var actualizador = new ActualizadorEstadoPoliza(
            new RepositorioEnMemoria<Poliza>([poliza]), new RepositorioEnMemoria<Cuota>(cuotas));

        await actualizador.ReevaluarAsync(poliza.Id, CancellationToken.None);

        Assert.Equal(EstadoPoliza.Vigente, poliza.Estado);
    }

    [Fact]
    public async Task ReevaluarAsync_SoloCuotasDeOtraPoliza_NoActiva()
    {
        var poliza = new PolizaBuilder().Con(p => p.Estado = EstadoPoliza.Pendiente).Construir();
        var ajena = new PolizaBuilder().Construir();
        var actualizador = new ActualizadorEstadoPoliza(
            new RepositorioEnMemoria<Poliza>([poliza]),
            new RepositorioEnMemoria<Cuota>([Cuota(poliza, 1, EstadoCuota.Pendiente), Cuota(ajena, 1, EstadoCuota.Pagada)]));

        await actualizador.ReevaluarAsync(poliza.Id, CancellationToken.None);

        Assert.Equal(EstadoPoliza.Pendiente, poliza.Estado);
    }

    [Fact]
    public async Task ReevaluarAsync_NoPersiste()
    {
        var poliza = new PolizaBuilder().Con(p => p.Estado = EstadoPoliza.Pendiente).Construir();
        var polizas = new RepositorioEnMemoria<Poliza>([poliza]);
        var cuotas = new RepositorioEnMemoria<Cuota>([Cuota(poliza, 1, EstadoCuota.Pagada)]);
        var actualizador = new ActualizadorEstadoPoliza(polizas, cuotas);

        await actualizador.ReevaluarAsync(poliza.Id, CancellationToken.None);

        // The change is tracked by the entity; saving belongs to whoever calls (IUnitOfWork).
        Assert.Equal(0, polizas.Escrituras);
        Assert.Equal(0, cuotas.Escrituras);
    }
}
