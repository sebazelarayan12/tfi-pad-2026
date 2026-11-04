# US-F3-07: rendición diaria de Pago Fácil

`POST /api/pagofacil/rendiciones` (multipart, campo `archivo`) procesa el archivo que
manda Pago Fácil con los cobros del día. `GET /api/pagofacil/rendiciones` muestra el
historial. Los dos usan `Politicas.Empleado`.

## Layout (propuesta hasta tener el PDF de Pago Fácil)

Cada línea tiene 60 dígitos ASCII y está definida en `LayoutRendicionPagoFacil`:

| Campo | Posición | Ancho | Formato |
|-------|----------|-------|---------|
| Código de barras (US-F3-06) | 0 | 42 | dígitos con verificadores |
| Fecha de pago | 42 | 8 | `yyyyMMdd` |
| Importe cobrado | 50 | 10 | centavos, con ceros a la izquierda |

## Cómo se procesa

1. Si hay líneas mal formadas, el nombre es inválido, el archivo está vacío o pesa más
   de 5 MB, responde 400 y no guarda nada.
2. Si el nombre ya se procesó, responde 400 (RN18).
3. Guarda el encabezado `RendicionPagoFacil`. Desde acá el nombre queda tomado.
4. Recorre las líneas en orden. Por cada una crea un `Pago` Pendiente (medio PagoFacil,
   `IdExterno = nombre#línea`), lo guarda y llama a `IAprobacionPagoService.AprobarAsync`
   de F4, que cobra la cuota, reevalúa la póliza y pide la factura.
5. Una línea que no se puede aplicar se informa con número y motivo, y el resto del
   archivo sigue. Por ejemplo: código inválido, otra empresa, póliza o cuota inexistente,
   cuota ya Pagada o Anulada, importe distinto, o rechazo de F4. Si la misma cuota aparece
   dos veces, se cobra la primera y la segunda se informa como cuota Pagada.

Cada línea se confirma por separado. No hay una única transacción para todo el archivo,
porque `AprobarAsync` guarda en varios pasos y llama a ARCA, un servicio externo, en el medio.

## Casos que quedan para revisión manual

**Pago rechazado por F4.** Si `AprobarAsync` rechaza una línea, el `Pago` queda en
Pendiente y la línea figura en los errores de la respuesta. Es a propósito: Pago Fácil ya
cobró ese dinero, y el pago Pendiente deja el rastro para revisarlo, con su `IdExterno`
y su `RendicionId`. No hay endpoint para reprocesarlo; lo resuelve un administrador.

**Error inesperado a mitad del archivo (500).** Puede ser una caída de la base o una
excepción no prevista.
- Las líneas anteriores ya quedaron cobradas y el encabezado quedó guardado, así que RN18
  no deja subir el archivo de nuevo con el mismo nombre.
- Para recuperarlo, subo el mismo archivo con otro nombre, por ejemplo
  `rendicion-20261105-reproceso.txt`.
- Las líneas que ya se cobraron vuelven como error "cuota Pagada", sin cobrar dos veces, y
  se aplican las que faltaban.
- Si el corte fue dentro de `AprobarAsync`, puede quedar un `Pago` Pendiente de esa línea.
  Se revisa igual que un rechazo.
