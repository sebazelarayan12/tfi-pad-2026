using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Aseguradora.Api.Serialization;
using Aseguradora.Domain.Enums;

namespace Aseguradora.Api.Externo;

/// <summary>Required HTTP fields prevent silent defaults in the external CU09 contract.</summary>
public sealed class CotizacionExternaBody
{
    /// <summary>Vehicle category in uppercase (9.5 C).</summary>
    [Required]
    [JsonConverter(typeof(UpperSnakeEnumConverter<TipoVehiculo>))]
    public TipoVehiculo? TipoVehiculo { get; init; }

    /// <summary>Vehicle manufacturing year.</summary>
    [Required]
    public int? Anio { get; init; }

    /// <summary>Declared vehicle use in uppercase (9.5 C).</summary>
    [Required]
    [JsonConverter(typeof(UpperSnakeEnumConverter<UsoVehiculo>))]
    public UsoVehiculo? Uso { get; init; }

    /// <summary>Driver age in years.</summary>
    [Required]
    public int? EdadConductor { get; init; }
}
