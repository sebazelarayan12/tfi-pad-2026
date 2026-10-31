# US-F4-05: webhook de pasarela

Fuente de verdad: sección US-F4-05 de `docs/tareas-divididas.md`.
Tarjeta: https://trello.com/c/NOWFJJBT.

`POST /api/webhooks/pasarela/{proveedor}` recibe `PasarelaWebhookRequest`.
Requiere `X-Api-Key` y que el claim del proveedor coincida con la ruta (401 en
caso contrario). Los proveedores válidos son `pasarela1` y `pasarela2`; otro
proveedor autenticado devuelve 404. El resultado aceptado devuelve 200 con
`{"recibido":true}`. Un pago desconocido sin referencia ni cuotas devuelve 404.

El servicio busca por proveedor e identificador externo. Una referencia existente
permite asociar el aviso a un pago online cuyo identificador aún no se guardó.
No permite sustituir un identificador ya asociado a otra referencia. Sin referencia,
`idCuotas` permite crear un pago pendiente: cuotas sin repetidos, pendientes/vencidas,
existentes y del mismo cliente. El importe es la suma de importes y recargos guardados.

APROBADO usa `IAprobacionPagoService`; RECHAZADO y CANCELADO rechazan sin cambiar
cuotas. Un pago finalizado es idempotente, no vuelve a facturar. Importe distinto:
200, pago pendiente y log `PAGO_IMPORTE_NO_COINCIDE`. La fecha de acreditación
proviene del aviso y se convierte a UTC. La conciliación puede reutilizar
`AplicarResultadoAsync` con una fecha explícita o, si no se proporciona, la hora UTC.

## Confianza y concurrencia

`Integraciones:Pasarelas:<proveedor>:ConfirmarWebhook` es true por defecto.
Se consulta la pasarela y se comparan identificador, referencia, estado e importe.
Una discrepancia devuelve recibido sin aplicar y loguea
`PAGO_CONFIRMACION_NO_COINCIDE`. Los fallos de consulta no se confunden con éxito:
la pasarela podrá reintentar.

SQL Server `sp_getapplock` serializa el mismo identificador externo entre procesos.
Se usa una conexión independiente con lock de sesión y liberación explícita al
terminar, sin transacción abierta durante la llamada a ARCA. Un error libera la
sesión; la indisponibilidad del lock produce un error reintentable. RowVersion e
índices únicos siguen protegiendo las escrituras. No requiere migración.

## Validación

Desde la raíz en Bash:

```bash
dotnet test backend --filter 'FullyQualifiedName~Webhook'
ASEGURADORA_TESTS_DOCKER=1 dotnet test backend
```

Para la prueba local con mocks, poner `PASARELA1_CONFIRMAR_WEBHOOK=false` en `.env`
y reconstruir/recrear la API. Compose lo mapea a
`Integraciones__Pasarelas__pasarela1__ConfirmarWebhook`. El mock actual mantiene
el checkout PENDIENTE, por lo que un aviso APROBADO no coincidiría con él. En un
servicio real mantener la confirmación habilitada.

Con una cuota pendiente de prueba, enviar (reemplazar idCuotas, idPago y fecha):

```json
{
  "idPago": "PSR-prueba-webhook-001",
  "estado": "APROBADO",
  "importe": 12000,
  "fecha": "2026-10-30T20:00:00Z",
  "idCuotas": ["f1000000-0000-0000-0000-000000000004"]
}
```

Usar la API key de pasarela1 del `.env`. Confirmar 200, pago aprobado, cuota pagada
y una factura consultando los endpoints de US-F4-03. Repetir el mismo idPago:
200 sin nueva factura. Con otro idPago y cuota pendiente, probar RECHAZADO/CANCELADO:
sin pago de cuotas. Importe incorrecto: 200 y cuotas intactas, con el log indicado.
Sin clave o con clave de pasarela2 en la ruta pasarela1: 401. Proveedor desconocido
con una clave válida: 404. No reutilizar cuotas ya cobradas para crear un pago nuevo.
