namespace Aseguradora.Application.Tiempo;

/// <summary>
/// Business dates follow Argentina time (spec 11.3), not the server clock, which runs in UTC.
/// </summary>
public static class FechaArgentina
{
    private const string ZonaIana = "America/Argentina/Buenos_Aires";

    // Argentina has no daylight saving time, so a fixed offset is a safe fallback when the host
    // lacks time zone data.
    private static readonly TimeSpan DesfaseFijo = TimeSpan.FromHours(-3);

    private static readonly TimeZoneInfo Zona = ObtenerZona();

    /// <summary>Today's date in Argentina according to <paramref name="reloj"/>.</summary>
    public static DateOnly Hoy(TimeProvider reloj)
    {
        ArgumentNullException.ThrowIfNull(reloj);
        return DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(reloj.GetUtcNow(), Zona).DateTime);
    }

    /// <summary>The UTC instant of <paramref name="fecha"/> at <paramref name="hora"/>, Argentina time.</summary>
    public static DateTimeOffset AUtc(DateOnly fecha, TimeOnly hora)
    {
        var local = fecha.ToDateTime(hora, DateTimeKind.Unspecified);
        return new DateTimeOffset(local, Zona.GetUtcOffset(local)).ToUniversalTime();
    }

    private static TimeZoneInfo ObtenerZona()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById(ZonaIana);
        }
        catch (Exception ex) when (ex is TimeZoneNotFoundException or InvalidTimeZoneException)
        {
            return TimeZoneInfo.CreateCustomTimeZone(ZonaIana, DesfaseFijo, ZonaIana, ZonaIana);
        }
    }
}
