using System.ComponentModel.DataAnnotations;
using Microsoft.Extensions.Options;

namespace Aseguradora.Integrations.Configuration;

/// <summary>
/// Validates the named options of one integration. The name is the key under <c>Integraciones</c>
/// (for example <c>Renaper</c> or <c>Pasarelas:pasarela1</c>), so every message names the exact
/// configuration key the operator has to fix. Runs at startup through <c>ValidateOnStart</c>.
/// </summary>
public sealed class IntegracionOptionsValidator<TOpciones> : IValidateOptions<TOpciones>
    where TOpciones : IntegracionOptions
{
    public ValidateOptionsResult Validate(string? name, TOpciones options)
    {
        ArgumentNullException.ThrowIfNull(options);

        var seccion = IntegracionOptions.Seccion(name ?? string.Empty);
        var errores = new List<string>();

        var resultados = new List<ValidationResult>();
        if (!Validator.TryValidateObject(options, new ValidationContext(options), resultados, validateAllProperties: true))
            errores.AddRange(resultados.Select(resultado =>
                $"{seccion}:{resultado.MemberNames.FirstOrDefault() ?? "valor"} {resultado.ErrorMessage}"));

        // The mock needs no address or key; the real client cannot work without them.
        if (!options.UsarMock)
        {
            if (string.IsNullOrWhiteSpace(options.BaseUrl))
                errores.Add($"{seccion}:BaseUrl es obligatoria cuando UsarMock es false.");
            else if (!Uri.TryCreate(options.BaseUrl, UriKind.Absolute, out _))
                errores.Add($"{seccion}:BaseUrl debe ser una URL absoluta.");

            if (string.IsNullOrWhiteSpace(options.ApiKey))
                errores.Add($"{seccion}:ApiKey es obligatoria cuando UsarMock es false.");
        }

        return errores.Count == 0
            ? ValidateOptionsResult.Success
            : ValidateOptionsResult.Fail(errores);
    }
}
