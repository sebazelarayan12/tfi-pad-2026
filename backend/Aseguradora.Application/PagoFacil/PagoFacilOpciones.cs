using System.ComponentModel.DataAnnotations;

namespace Aseguradora.Application.PagoFacil;

/// <summary>
/// Pago Fácil settings (section <c>PagoFacil</c>, environment variable <c>PagoFacil__CodigoEmpresa</c>).
/// The company code is the one Pago Fácil assigns to the insurer.
/// </summary>
public sealed class PagoFacilOpciones
{
    public const string Seccion = "PagoFacil";
    public const int CodigoEmpresaMaximo = 99999;

    [Range(1, CodigoEmpresaMaximo, ErrorMessage = "PagoFacil__CodigoEmpresa debe tener entre 1 y 5 dígitos.")]
    public int CodigoEmpresa { get; set; }
}
