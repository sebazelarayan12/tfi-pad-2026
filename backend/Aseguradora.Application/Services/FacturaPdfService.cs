using Aseguradora.Application.Exceptions;
using Aseguradora.Application.External;
using Aseguradora.Domain.Entities;
using Aseguradora.Domain.Enums;
using Aseguradora.Domain.Interfaces;

namespace Aseguradora.Application.Services;

/// <summary>PDF de una factura emitida: el contenido y el nombre con el que se ofrece para descargar.</summary>
public sealed record FacturaPdf(byte[] Contenido, string NombreArchivo);

/// <summary>Obtiene el PDF de la factura de un pago desde el servicio de facturación.</summary>
public interface IFacturaPdfService
{
    /// <exception cref="NotFoundException">El pago no tiene factura.</exception>
    /// <exception cref="BusinessRuleException">La factura todavía no tiene CAE, así que no hay PDF.</exception>
    Task<FacturaPdf> ObtenerAsync(Guid pagoId, CancellationToken ct = default);
}

/// <inheritdoc />
public sealed class FacturaPdfService(IRepository<Factura> facturas, IArcaService arca) : IFacturaPdfService
{
    public async Task<FacturaPdf> ObtenerAsync(Guid pagoId, CancellationToken ct = default)
    {
        var factura = (await facturas.FindAsync(f => f.PagoId == pagoId, ct)).SingleOrDefault()
            ?? throw new NotFoundException("No se encontró la factura del pago.");
        if (factura.Estado != EstadoFactura.Autorizada)
            throw new BusinessRuleException("La factura todavía no tiene CAE, por eso aún no hay PDF.");

        var contenido = await arca.ObtenerPdfAsync(factura.Numero, factura.Tipo, ct);
        return new FacturaPdf(contenido, $"factura-{factura.Tipo}-{factura.Numero}.pdf");
    }
}
