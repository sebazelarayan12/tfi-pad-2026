using Aseguradora.Domain.Entities;

namespace Aseguradora.Tests.Builders;

/// <summary>An active plan that accepts every vehicle type (RN05), with a unique code (the seed uses RC).</summary>
public sealed class PlanBuilder : TestBuilder<Plan, PlanBuilder>
{
    protected override Plan CrearPorDefecto() => new()
    {
        Id = Guid.NewGuid(),
        Codigo = $"T{Secuencia:D5}",
        Nombre = $"Plan de prueba {Secuencia}",
        Descripcion = "Plan de prueba.",
        PrimaBase = 10000.00m,
        TiposPermitidos = "Auto,Moto,Camioneta",
        AntiguedadMaxima = null,
        Activo = true
    };
}
