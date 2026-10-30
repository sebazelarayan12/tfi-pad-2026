# US-F4-03: caja y consulta de comprobantes

Tarjeta: https://trello.com/c/J7DGANfB. Fuente de verdad: sección US-F4-03 de
`docs/tareas-divididas.md`.

## Contratos

- `POST /api/pagos/caja`: JWT de empleado o administrador. Recibe
  `{ "cuotaIds": ["<guid>"] }` y devuelve 201, `Location` de la consulta del pago
  y `PagoResponse` con `estado: APROBADO`, `medio: CAJA` y su factura.
- `GET /api/pagos/{id}`: misma autorización; devuelve el pago y su factura
  cuando existe. Un pago inexistente devuelve 404.
- `GET /api/pagos/{id}/factura`: misma autorización; devuelve la factura o 404
  si aún no existe. Una factura pendiente devuelve 200 con
  `estado: PENDIENTE_CAE`, `cae: null` y `vencimientoCae: null`.
- `POST /api/publico/factura`: anónimo, recibe
  `{ "dni": "30123456", "numeroPago": "PAG-xxxxxx" }`. Usa
  `IVerificadorPublico` y el límite global del prefijo público. Un DNI o número
  incorrectos producen el mismo 404 y mensaje genérico.

Las cuotas pueden ser de varias pólizas de un mismo cliente. Vacías, repetidas,
pagadas, anuladas o de clientes distintos producen 400; una cuota inexistente,
404. El importe incluye los recargos guardados. La aprobación, actualización de
pólizas e IVA se delegan al circuito de US-F4-02. Si ARCA no responde, el cobro
queda aprobado y la factura queda pendiente para su posterior recuperación.

Se conserva la reserva de cuotas de pagos online: caja rechaza cuotas con un pago
pendiente dentro de `Pagos:ReservaMinutos` para evitar cobrar mientras hay un
checkout vigente. Las modificaciones de cuotas del circuito compartido usan
RowVersion para detectar cobros concurrentes en SQL Server.

No requiere migración ni configuración adicional a US-F4-02 y US-F4-04.

Las fechas de creación, acreditación y emisión se devuelven en UTC con sufijo `Z`,
también al recargar desde `datetime2` (que no guarda `DateTimeKind`). Las fechas
calendario, como el vencimiento del CAE, siguen usando `DateOnly`.

## Validación local

Desde la raíz del repositorio, ejecutar en Bash:

```bash
dotnet build backend
dotnet test backend --filter 'FullyQualifiedName~Aseguradora.Tests.Pagos'
dotnet test backend
```

Para la prueba manual, usar la API local con integraciones mock, datos fiscales
configurados y un JWT obtenido por `POST /api/auth/login`. En Swagger autorizar
con ese JWT. Consultar las cuotas de `POL-0000001` mediante
`GET /api/polizas/d1000000-0000-0000-0000-000000000001/cuotas`; elegir una
pendiente que no tenga otro pago en curso. En una base recién creada, la cuota 2
es `f1000000-0000-0000-0000-000000000002`.

1. Enviar esa cuota a `POST /api/pagos/caja`. Verificar 201, `APROBADO`, `CAJA`,
   número `PAG-` con seis hexadecimales, importe correcto y factura autorizada.
2. Consultar el pago y su factura con el `id` recibido. Verificar número, CAE de
   14 dígitos y vencimiento. Consultar de nuevo las cuotas: la elegida está pagada.
3. Repetir el cobro de esa cuota: 400. Probar lista vacía, IDs repetidos y cuota
   inexistente: 400, 400 y 404 respectivamente. Consultar un pago inexistente: 404.
4. Sin JWT, consultar o cobrar en `/api/pagos/*`: 401. Un JWT válido sin rol de
   empleado/administrador obtiene 403.
5. Sin sesión, enviar a `POST /api/publico/factura` el DNI del titular y el
   número recibido en el paso 1: 200 y la misma factura. Cambiar solamente el DNI
   y luego solamente el número: ambos devuelven 404 con el mismo mensaje.

La prueba consume las cuotas elegidas: para otro cobro válido elegir otra cuota
pendiente. El seed contiene un pago aprobado sin factura; usar el pago creado en
el paso 1 para validar la consulta pública.
