using System.ComponentModel.DataAnnotations;

namespace Aseguradora.Api.BackgroundJobs;

/// <summary>Configuración del reintento de CAE en una sola réplica.</summary>
public sealed class ReintentoFacturasOpciones
{
    public bool ReintentosHabilitados { get; set; } = true;
    [Range(1, 1440)]
    public int IntervaloReintentoMinutos { get; set; } = 15;
}
