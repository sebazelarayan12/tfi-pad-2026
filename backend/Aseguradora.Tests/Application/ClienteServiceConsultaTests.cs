using System.ComponentModel.DataAnnotations;
using Aseguradora.Application.Clientes;
using Aseguradora.Application.Clientes.DTOs;
using Aseguradora.Application.Exceptions;
using Aseguradora.Data;
using Aseguradora.Data.Repositories;
using Aseguradora.Data.Seed;
using Aseguradora.Domain.Entities;
using Aseguradora.Integrations.Renaper;
using Aseguradora.Tests.Builders;
using Aseguradora.Tests.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;

namespace Aseguradora.Tests.Application;

/// <summary>CU05: query, modification and soft deletion of clients (RN01, RN15).</summary>
public sealed class ClienteServiceConsultaTests : IDisposable
{
    private readonly SqliteDbFixture _fixture = new();

    public void Dispose() => _fixture.Dispose();

    private static ClienteService CrearServicio(AseguradoraDbContext context) =>
        new(
            new EfRepository<Cliente>(context),
            new EfRepository<Poliza>(context),
            new RenaperMockService(),
            new UnitOfWork(context),
            TimeProvider.System,
            NullLogger<ClienteService>.Instance);

    private static async Task<Cliente> AgregarClienteAsync(
        AseguradoraDbContext context,
        string apellido = "Alvarez",
        string? dni = null,
        string? email = null,
        bool activo = true)
    {
        var cliente = new ClienteBuilder().Construir();
        cliente.Apellido = apellido;
        cliente.Activo = activo;
        if (dni is not null)
            cliente.Dni = dni;
        if (email is not null)
            cliente.Email = email;

        context.Clientes.Add(cliente);
        await context.SaveChangesAsync();
        return cliente;
    }

    private static ClienteModificacionRequest Modificacion(string email = "nuevo@example.com") => new()
    {
        Email = email,
        Telefono = "3815551234",
        Calle = "Calle Nueva",
        Numero = "742",
        Localidad = "Yerba Buena",
        Provincia = "Tucumán",
        CodigoPostal = "4107"
    };

    [Fact]
    public async Task ListarAsync_filtra_por_dni_exacto()
    {
        await using var context = _fixture.CreateContext();
        await AgregarClienteAsync(context, "Alvarez", dni: "40123456");
        var service = CrearServicio(context);

        var pagina = await service.ListarAsync(new ClienteFiltro { Dni = "30123456" });

        var item = Assert.Single(pagina.Items);
        Assert.Equal(SeedData.ClienteId, item.Id);
        Assert.Equal("30123456", item.Dni);
        Assert.Equal(1, pagina.Total);
    }

    [Fact]
    public async Task ListarAsync_filtra_por_apellido_parcial_sin_distinguir_mayusculas()
    {
        await using var context = _fixture.CreateContext();
        await AgregarClienteAsync(context, "Peralta");
        var service = CrearServicio(context);

        var pagina = await service.ListarAsync(new ClienteFiltro { Apellido = "RAL" });

        var item = Assert.Single(pagina.Items);
        Assert.Equal("Peralta", item.Apellido);
    }

    [Theory]
    [InlineData("pe")]
    [InlineData("perez")]
    [InlineData("PEREZ")]
    [InlineData("pérez")]
    [InlineData("  pér  ")]
    public async Task ListarAsync_apellido_no_distingue_tildes_en_el_texto_buscado(string texto)
    {
        await using var context = _fixture.CreateContext();
        var service = CrearServicio(context);

        var pagina = await service.ListarAsync(new ClienteFiltro { Apellido = texto });

        var item = Assert.Single(pagina.Items);
        Assert.Equal(SeedData.ClienteId, item.Id);
        Assert.Equal("Pérez", item.Apellido);
    }

    [Fact]
    public async Task ListarAsync_apellido_no_distingue_tildes_en_el_dato_guardado_y_conserva_la_enie()
    {
        await using var context = _fixture.CreateContext();
        await AgregarClienteAsync(context, "Peña");
        var service = CrearServicio(context);

        var conTilde = await service.ListarAsync(new ClienteFiltro { Apellido = "perez" });
        var enie = await service.ListarAsync(new ClienteFiltro { Apellido = "pena" });

        Assert.Equal(["Pérez"], conTilde.Items.Select(i => i.Apellido));
        Assert.Empty(enie.Items);
    }

    [Fact]
    public async Task ListarAsync_pagina_devuelve_el_segundo_elemento_y_el_total()
    {
        await using var context = _fixture.CreateContext();
        await AgregarClienteAsync(context, "Alvarez");
        await AgregarClienteAsync(context, "Benitez");
        var service = CrearServicio(context);

        var pagina = await service.ListarAsync(new ClienteFiltro { Pagina = 2, TamanoPagina = 1 });

        // Ordered by last name: Alvarez, Benitez, Pérez (seeded).
        var item = Assert.Single(pagina.Items);
        Assert.Equal("Benitez", item.Apellido);
        Assert.Equal(2, pagina.Pagina);
        Assert.Equal(1, pagina.TamanoPagina);
        Assert.Equal(3, pagina.Total);
    }

    [Fact]
    public async Task ListarAsync_excluye_los_clientes_dados_de_baja()
    {
        await using var context = _fixture.CreateContext();
        var inactivo = await AgregarClienteAsync(context, "Alvarez", activo: false);
        var service = CrearServicio(context);

        var pagina = await service.ListarAsync(new ClienteFiltro { Dni = inactivo.Dni });

        Assert.Empty(pagina.Items);
        Assert.Equal(0, pagina.Total);
    }

    [Fact]
    public async Task ListarAsync_no_devuelve_mas_que_la_pagina_pedida()
    {
        await using var context = _fixture.CreateContext();
        await AgregarClienteAsync(context, "Alvarez");
        await AgregarClienteAsync(context, "Benitez");
        var service = CrearServicio(context);

        var pagina = await service.ListarAsync(new ClienteFiltro { TamanoPagina = 2 });

        Assert.Equal(2, pagina.Items.Count);
        Assert.Equal(3, pagina.Total);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(101)]
    public void ClienteFiltro_rechaza_tamanoPagina_fuera_de_rango(int tamanoPagina)
    {
        var filtro = new ClienteFiltro { TamanoPagina = tamanoPagina };
        var errores = new List<ValidationResult>();

        var valido = Validator.TryValidateObject(
            filtro, new ValidationContext(filtro), errores, validateAllProperties: true);

        Assert.False(valido);
        Assert.Contains(errores, e => e.MemberNames.Contains(nameof(ClienteFiltro.TamanoPagina)));
    }

    [Fact]
    public async Task ObtenerAsync_devuelve_el_detalle_del_cliente()
    {
        await using var context = _fixture.CreateContext();
        var service = CrearServicio(context);

        var cliente = await service.ObtenerAsync(SeedData.ClienteId);

        Assert.Equal(SeedData.ClienteId, cliente.Id);
        Assert.Equal("30123456", cliente.Dni);
        Assert.Equal("Pérez", cliente.Apellido);
        Assert.True(cliente.Activo);
    }

    [Fact]
    public async Task ObtenerAsync_con_id_inexistente_lanza_NotFoundException()
    {
        await using var context = _fixture.CreateContext();
        var service = CrearServicio(context);

        var ex = await Assert.ThrowsAsync<NotFoundException>(
            () => service.ObtenerAsync(Guid.NewGuid()));

        Assert.Equal(ClienteService.CodigoClienteNoEncontrado, ex.Codigo);
    }

    [Fact]
    public async Task ObtenerAsync_de_un_cliente_dado_de_baja_lanza_NotFoundException()
    {
        await using var context = _fixture.CreateContext();
        var inactivo = await AgregarClienteAsync(context, activo: false);
        var service = CrearServicio(context);

        await Assert.ThrowsAsync<NotFoundException>(() => service.ObtenerAsync(inactivo.Id));
    }

    [Fact]
    public async Task ModificarAsync_cambia_solo_contacto_y_domicilio()
    {
        await using var context = _fixture.CreateContext();
        var service = CrearServicio(context);

        var modificado = await service.ModificarAsync(SeedData.ClienteId, Modificacion());

        Assert.Equal("nuevo@example.com", modificado.Email);
        Assert.Equal("3815551234", modificado.Telefono);
        Assert.Equal("Calle Nueva", modificado.Calle);
        Assert.Equal("742", modificado.Numero);
        Assert.Equal("Yerba Buena", modificado.Localidad);
        Assert.Equal("4107", modificado.CodigoPostal);
        // DNI, name and Renaper data stay as they were.
        Assert.Equal("30123456", modificado.Dni);
        Assert.Equal("Juan Carlos", modificado.Nombre);
        Assert.Equal("Pérez", modificado.Apellido);
        Assert.True(modificado.ValidadoRenaper);

        var enBase = await context.Clientes.AsNoTracking().SingleAsync(c => c.Id == SeedData.ClienteId);
        Assert.Equal("nuevo@example.com", enBase.Email);
        Assert.Equal("30123456", enBase.Dni);
        Assert.Equal("Juan Carlos", enBase.Nombre);
    }

    [Fact]
    public async Task ModificarAsync_permite_conservar_el_email_del_propio_cliente()
    {
        await using var context = _fixture.CreateContext();
        var service = CrearServicio(context);

        var modificado = await service.ModificarAsync(
            SeedData.ClienteId, Modificacion("juan.perez@example.com"));

        Assert.Equal("juan.perez@example.com", modificado.Email);
    }

    [Fact]
    public async Task ModificarAsync_con_email_de_otro_cliente_lanza_excepcion_y_no_cambia_nada()
    {
        await using var context = _fixture.CreateContext();
        var otro = await AgregarClienteAsync(context, email: "otro@example.com");
        var service = CrearServicio(context);

        var ex = await Assert.ThrowsAsync<BusinessRuleException>(
            () => service.ModificarAsync(SeedData.ClienteId, Modificacion(otro.Email)));

        Assert.Contains("RN01", ex.Message, StringComparison.OrdinalIgnoreCase);
        var enBase = await context.Clientes.AsNoTracking().SingleAsync(c => c.Id == SeedData.ClienteId);
        Assert.Equal("juan.perez@example.com", enBase.Email);
        Assert.Equal("San Martín", enBase.Calle);
        Assert.Equal("1234", enBase.Numero);
    }

    [Fact]
    public async Task DarDeBajaAsync_marca_Activo_falso_y_conserva_la_fila()
    {
        await using var context = _fixture.CreateContext();
        var cliente = await AgregarClienteAsync(context);
        var service = CrearServicio(context);

        await service.DarDeBajaAsync(cliente.Id);

        var enBase = await context.Clientes.AsNoTracking().SingleAsync(c => c.Id == cliente.Id);
        Assert.False(enBase.Activo);
        Assert.Equal(cliente.Dni, enBase.Dni);
    }

    [Fact]
    public async Task DarDeBajaAsync_con_poliza_activa_lanza_excepcion_y_no_modifica()
    {
        await using var context = _fixture.CreateContext();
        var service = CrearServicio(context);

        // The seeded client has a Vigente policy (SeedData).
        var ex = await Assert.ThrowsAsync<BusinessRuleException>(
            () => service.DarDeBajaAsync(SeedData.ClienteId));

        Assert.Contains("póliza activa", ex.Message, StringComparison.OrdinalIgnoreCase);
        var enBase = await context.Clientes.AsNoTracking().SingleAsync(c => c.Id == SeedData.ClienteId);
        Assert.True(enBase.Activo);
    }

    [Fact]
    public async Task DarDeBajaAsync_de_un_cliente_ya_dado_de_baja_lanza_NotFoundException()
    {
        await using var context = _fixture.CreateContext();
        var inactivo = await AgregarClienteAsync(context, activo: false);
        var service = CrearServicio(context);

        await Assert.ThrowsAsync<NotFoundException>(() => service.DarDeBajaAsync(inactivo.Id));
    }
}
