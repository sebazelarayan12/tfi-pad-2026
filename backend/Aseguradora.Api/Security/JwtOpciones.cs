using System.ComponentModel.DataAnnotations;

namespace Aseguradora.Api.Security;

/// <summary>
/// JWT settings for employees and administrators. The signing key always comes from the
/// <c>Jwt__Key</c> environment variable (never from <c>appsettings.json</c>) and must have at
/// least <see cref="LongitudMinimaClave"/> characters, otherwise the application does not start.
/// </summary>
public sealed class JwtOpciones
{
    public const string Seccion = "Jwt";
    public const int LongitudMinimaClave = 32;
    public const string EmisorPredeterminado = "Aseguradora";
    public const string AudienciaPredeterminada = "Aseguradora";
    public const int ExpiracionMinutosPredeterminada = 480;

    [Required(ErrorMessage = "Falta Jwt__Issuer.")]
    public string Issuer { get; set; } = EmisorPredeterminado;

    [Required(ErrorMessage = "Falta Jwt__Audience.")]
    public string Audience { get; set; } = AudienciaPredeterminada;

    [Required(ErrorMessage = "Falta Jwt__Key.")]
    [MinLength(LongitudMinimaClave, ErrorMessage = "Jwt__Key debe tener al menos 32 caracteres.")]
    public string Key { get; set; } = string.Empty;

    [Range(1, int.MaxValue, ErrorMessage = "Jwt__ExpiracionMinutos debe ser mayor que cero.")]
    public int ExpiracionMinutos { get; set; } = ExpiracionMinutosPredeterminada;
}
