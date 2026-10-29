namespace Aseguradora.Domain.Entities;

/// <summary>
/// Last date a daily process ran (US-F3-05), so it runs once per day even if the API restarts.
/// </summary>
public class ControlProceso : EntityBase
{
    /// <summary>Unique process key, e.g. <c>VencimientosDiarios</c>.</summary>
    public string Nombre { get; set; } = string.Empty;

    /// <summary>Last business date (Argentina) the process completed.</summary>
    public DateOnly UltimaFechaProcesada { get; set; }
}
