# US-F4-09: reintentos de CAE

Tarjeta: https://trello.com/c/AVEiM0ph. Fuente: US-F4-09 de `docs/tareas-divididas.md`.

El job corre al iniciar la API y luego espera `Facturacion:IntervaloReintentoMinutos`
(default 15, rango 1–1440). `FACTURACION_INTERVALO_REINTENTO_MINUTOS` en Compose
permite configurarlo. `FACTURACION_REINTENTOS_HABILITADOS=false` lo desactiva.
Los tests de API compartidos lo deshabilitan para no modificar sus fixtures.

Solo selecciona facturas PendienteCae y reutiliza EmitirAsync con el mismo pago,
referencia externa y fila de factura. Las Autorizada no se envían nuevamente.
No hay límite de intentos: se conserva el default de la tarea. Requiere una sola
réplica; escalar necesita coordinación en base, fuera de alcance.

Cada reintento de producción se ejecuta en un scope independiente. Una excepción
se registra con factura y número de pago, y no contamina las escrituras del siguiente.
Un error de la corrida tampoco termina el job: se reintenta en el próximo intervalo.
La cancelación al apagar se propaga. No se modifica VencimientosJob.

Reiniciar conserva la misma factura y referencia externa: ARCA debe ser idempotente
por referenciaExterna, también cuando autorizó antes de que se cortara la conexión.
Con ARCA real este contrato debe estar acordado. No se duplica la fila de factura.

Validación desde la raíz:

```bash
dotnet test backend --filter 'FullyQualifiedName~FacturacionReintentosTests|FullyQualifiedName~ReintentoFacturasJobTests'
ASEGURADORA_TESTS_DOCKER=1 dotnet test backend
```

Prueba manual: con una factura pendiente de CAE y ARCA disponible, configurar el
intervalo en 1 minuto, reconstruir la API y comprobar FACTURA_REINTENTO en logs.
Consultar la factura desde GET /api/pagos/{id}/factura: pasa a AUTORIZADA con CAE,
sin cambiar su id. Otra corrida no debe volver a enviarla. Para simular la caída
y recuperación se usa el fake de FacturacionReintentosTests; no se agregan endpoints
de fallo al producto. Restablecer el intervalo deseado al terminar.
