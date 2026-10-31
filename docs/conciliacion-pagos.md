# US-F4-06: conciliación de pagos

Tarjeta: https://trello.com/c/UAwvn0Bb. Fuente de verdad: sección US-F4-06 de
`docs/tareas-divididas.md`.

`POST /api/pagos/{id}/conciliar` no recibe cuerpo. Requiere JWT de empleado o
administrador y devuelve el `PagoResponse` existente (`importe`, estado y factura).

Solo admite medio Pasarela (Caja/Pago Fácil: 400). Si ya está aprobado o rechazado,
devuelve 200 sin consultar a la pasarela. Si está pendiente, necesita proveedor e
identificador externo; consulta el estado y reutiliza `WebhookPagoService.AplicarResultadoAsync`.
Se verifica que la respuesta corresponda al identificador y referencia consultados.
Se usa la fecha de la pasarela en UTC para acreditar, no la hora de la conciliación.

APROBADO paga y factura; PENDIENTE no modifica el pago; RECHAZADO/CANCELADO rechazan
sin pagar cuotas. Las diferencias de importe, el tratamiento de duplicados y las
facturas pendientes de CAE conservan el comportamiento de US-F4-05/US-F4-02.
El núcleo recarga el pago y RowVersion dentro del lock: si llegó el webhook mientras
se consultaba a la pasarela, no vuelve a aprobar ni facturar.

Pago inexistente: 404. Respuesta de otro pago, estado desconocido o importe no
positivo en la respuesta de la pasarela: 502, sin modificar el pago ni las cuotas.
La validación del aviso webhook sigue devolviendo 400 para pedidos inválidos.
Timeout de lock: 503 con
Retry-After. No requiere migraciones ni configuración nueva.

## Validación

Desde la raíz en Git Bash:

```bash
dotnet test backend --filter 'FullyQualifiedName~ConciliarPago'
ASEGURADORA_TESTS_DOCKER=1 dotnet test backend
```

Prueba manual con API reconstruida y JWT en Swagger:

1. Crear un pago mediante `POST /api/publico/pagos` con una cuota pendiente del
   titular. Conservar el `idPago` que devuelve.
2. Enviar `POST /api/pagos/{idPago}/conciliar`, sin cuerpo, con JWT. El mock actual
   conserva el checkout PENDIENTE: debe devolver 200 con PENDIENTE y sin factura.
3. Simular la aprobación mediante el webhook de US-F4-05 sobre ese mismo pago
   (confirmación desactivada solo para el mock local). Conciliar de nuevo:
   debe devolver APROBADO con la misma factura, sin consultar ni emitir otra vez.
4. Conciliar un pago de caja: 400. Un GUID inexistente: 404. Sin JWT: 401.

La aprobación directamente desde la respuesta de la pasarela se verifica con
`ConciliarPagoTests`: el mock local no dispone de un endpoint para cambiar su
estado. No se agregan rutas de simulación al producto.
