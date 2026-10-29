using System.Reflection;
using Aseguradora.Api.Controllers;
using Aseguradora.Domain.Entities;
using Microsoft.AspNetCore.Mvc;

namespace Aseguradora.Tests.Api;

/// <summary>Responses are DTOs: no endpoint exposes a domain entity (C3).</summary>
public sealed class ContratosDtoTests
{
    public static TheoryData<Type> Controladores => new() { typeof(PolizasController) };

    [Theory]
    [MemberData(nameof(Controladores))]
    public void NingunTipoDeRespuestaExponeUnaEntidad(Type controlador)
    {
        var acciones = controlador.GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly);
        Assert.NotEmpty(acciones);

        foreach (var accion in acciones)
        {
            var tipos = accion.GetCustomAttributes<ProducesResponseTypeAttribute>()
                .Select(a => a.Type)
                .Append(accion.ReturnType);
            foreach (var tipo in tipos)
            {
                var entidad = BuscarEntidad(tipo, []);
                Assert.True(entidad is null, $"{controlador.Name}.{accion.Name} exposes the entity {entidad?.Name}.");
            }
        }
    }

    [Fact]
    public void LaPruebaDetectaUnaEntidadAnidada()
    {
        Assert.Equal(typeof(Cuota), BuscarEntidad(typeof(Task<ActionResult<IReadOnlyList<Cuota>>>), []));
    }

    /// <summary>The first entity found in the type, its generic arguments or its public properties.</summary>
    private static Type? BuscarEntidad(Type tipo, HashSet<Type> visitados)
    {
        if (!visitados.Add(tipo))
            return null;
        if (typeof(EntityBase).IsAssignableFrom(tipo))
            return tipo;
        if (tipo.IsArray)
            return BuscarEntidad(tipo.GetElementType()!, visitados);
        foreach (var argumento in tipo.GetGenericArguments())
        {
            if (BuscarEntidad(argumento, visitados) is { } encontrada)
                return encontrada;
        }

        // Framework types (Task, ActionResult, string...) are only containers; their members are not the contract.
        if (tipo.Namespace?.StartsWith("Aseguradora", StringComparison.Ordinal) != true)
            return null;

        return tipo.GetProperties(BindingFlags.Public | BindingFlags.Instance)
            .Select(p => BuscarEntidad(p.PropertyType, visitados))
            .FirstOrDefault(t => t is not null);
    }
}
