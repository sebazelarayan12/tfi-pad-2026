using System.ComponentModel.DataAnnotations;
namespace Aseguradora.Integrations.Options;
public class PasarelaOptions
{
    public bool UsarMock { get; set; } = true;
    [Url] public string? BaseUrl { get; set; }
    public string? ApiKey { get; set; }
}