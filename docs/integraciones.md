# Integraciones externas

Estado de los servicios de otros grupos y cómo pasar de mock a real (US-T-04). Cada servicio vive detrás de una interfaz de `Application/External`; el selector `Integraciones:<Servicio>:UsarMock` elige la implementación al arrancar (`AgregarIntegracion`, US-T-02).

## Los 5 servicios

| Servicio | Interfaz | Clave de configuración | Mock | Real | Responsable | Estado |
|----------|----------|------------------------|------|------|-------------|--------|
| Renaper | `IRenaperService` | `Integraciones:Renaper` | `RenaperMockService` | `RenaperHttpService` | Grupo OpenRENAPER | Real implementado contra OpenRENAPER (sin clave); activar con `UsarMock=false`. Ver "Particularidades" |
| DNRPA | `IDnrpaService` | `Integraciones:Dnrpa` | `DnrpaMockService` | `DnrpaHttpService` | Sin grupo | Mock definitivo (no hay servicio real accesible). **El alta de vehículo ya no lo consulta**: marca, modelo, año, tipo, motor y chasis se cargan a mano y el vehículo queda con `ValidadoDnrpa = false`. |
| ARCA | `IArcaService` | `Integraciones:Arca` | `ArcaMockService` | `ArcaHttpService` | Grupo FacturAR | Real implementado contra FacturAR; falta su API key para activarlo. Ver "Particularidades" |
| Pasarela 1 | `IPasarelaService` (vía `IPasarelaResolver`) | `Integraciones:Pasarelas:pasarela1` | `PasarelaMockService` | `PasarelaHttpService` o `PadiPasarelaService` (`Tipo=Padi`) | Grupo de la pasarela 1 / PADI | Mock; PADI disponible (ver abajo) |
| Pasarela 2 | `IPasarelaService` (vía `IPasarelaResolver`) | `Integraciones:Pasarelas:pasarela2` | `PasarelaMockService` | `PasarelaHttpService` | Grupo de la pasarela 2 | Mock; real pendiente |

Esta tabla cubre lo que nosotros consumimos. Lo que otros grupos consumen de nosotros (seguro vigente, deuda, cotización) y cómo obtienen su clave están en [`docs/api-externa.md`](api-externa.md).

Estado al 02/11/2026. Pago Fácil no está en esta tabla: es un servicio simulado por nosotros, sin cliente HTTP.

## Configuración de cada servicio

Cada clave tiene tres ajustes. Con `UsarMock=true` (valor por defecto) no hace falta nada más.

| Ajuste | Para qué | Variable de entorno |
|--------|----------|---------------------|
| `UsarMock` | `true` usa el mock, `false` el cliente HTTP real | `Integraciones__<Servicio>__UsarMock` |
| `BaseUrl` | URL base de la API del otro grupo (obligatoria con `UsarMock=false`) | `Integraciones__<Servicio>__BaseUrl` |
| `ApiKey` | Clave que enviamos al otro grupo | `INTEGRACIONES_<SERVICIO>_APIKEY` en `.env` (ver `.env.example`) |

Para las pasarelas, `<Servicio>` es `Pasarelas__pasarela1` o `Pasarelas__pasarela2`. Además, `Integraciones:Pasarelas:<proveedor>:ConfirmarWebhook` (por defecto `true`) hace que el webhook se confirme contra la pasarela; el mock deja el pago en `PENDIENTE`, así que con mocks hay que ponerlo en `false` (ver `docs/webhook-pasarela.md`).

## Particularidades de OpenRENAPER y FacturAR

**OpenRENAPER** (`POST /api/v1/consultas`, sin autenticación; por eso `Integraciones__Renaper__RequiereApiKey=false`). Devuelve solo `nombre`, `dni`, `cuit`, `edad`, `sexo` y `provincia_ubicacion`, todos opcionales. Consecuencias en el alta de cliente:

- RN01 (mayor de 18) se verifica con la `edad` de Renaper. Si no la publica, el cliente se registra con `ValidadoRenaper=false`.
- RN02 (fallecido) no se puede verificar: la fuente no informa estado.
- No hay domicilio ni fecha de nacimiento: se conserva lo que cargó el empleado. El nombre llega en un solo texto; si viene como `Nombre APELLIDO` (apellido en mayúsculas) se separa y se precargan nombre y apellido, si no (todo en mayúsculas, empresa) no se adivina y solo se pisan CUIL y sexo.
- Un DNI compartido por varias personas responde 409; se reintenta por el CUIL cargado.
- Límite de 15 consultas por minuto por IP y disponibilidad bajo demanda (no 24/7): una caída no bloquea el alta (queda sin validar).

**FacturAR** (`POST /v1/comprobantes`, header `X-Api-Key` con una clave `fak_...` y `Idempotency-Key` = número de pago). La empresa emisora sale de la clave, así que `Facturacion:Cuit` no se envía; `Facturacion:PuntoVenta` debe existir y estar activo en su portal. Se emite Factura B (tipo 6) con IVA incluido. No hay consulta por número de comprobante (`ConsultarFacturaAsync` falla), y el PDF no se guarda. Para verlo, `GET /api/pagos/{id}/factura/pdf` busca el comprobante de FacturAR por tipo, punto de venta y número (`GET /v1/comprobantes`, páginas de 100) y descarga `GET /v1/comprobantes/{id}/pdf`; solo para facturas con CAE. En el backoffice es el botón "Ver PDF" del panel de factura.

Probado contra facturAR real (09/11/2026): el `documentoTipo` del receptor se manda **por nombre** (`DNI`, `CUIT`, `CUIL`); los códigos numéricos de AFIP (`96` para DNI) responden 400 `CUIT_INVALIDO`. Cuando facturAR rechaza una emisión, la API deja `ARCA_EMISION_FALLIDA` con el motivo en el log y la factura queda `Pendiente CAE`; el reintento automático (cada `FACTURACION_INTERVALO_REINTENTO_MINUTOS`) la emite sola cuando se corrige la causa. El servicio no devuelve PDF: no hay enlace a la factura.

## PADI como Pasarela A (pasarela1)

PADI (`https://padi.runasp.net`, doc en https://padi-api.mintlify.site/) reemplaza a "Pasarela A". Por dentro sigue siendo el proveedor `pasarela1`; `pasarela2` y Pago Fácil no cambian. Es un cliente más de `IPasarelaService` (`Aseguradora.Integrations/Padi/PadiPasarelaService.cs`): `PasarelaHttpService`, el mock y el contrato 9.3 quedan igual.

**Activarlo** (variables del `.env`, nunca en el repo):

| Variable | Valor |
|---|---|
| `INTEGRACIONES_PASARELA1_USAR_MOCK` | `false` |
| `INTEGRACIONES_PASARELA1_TIPO` | `Padi` (por defecto `Contrato93`, el cliente del contrato 9.3) |
| `INTEGRACIONES_PASARELA1_BASEURL` | `https://padi.runasp.net` |
| `INTEGRACIONES_PASARELA1_APIKEY` | Clave de comercio de PADI (header `X-Api-Key`) |
| `INTEGRACIONES_PASARELA1_WEBHOOK_SECRET` | Secreto del webhook, de 32 a 256 caracteres |

La API no arranca si `Tipo=Padi` está en `pasarela2`, si falta el secreto o si el link no vence antes que la reserva. El link dura `Pagos:ReservaMinutos - 10` minutos (50 con el default de 60); se puede fijar con `Integraciones:Pasarelas:pasarela1:TtlMinutos`, siempre menor que la reserva.

**Cómo funciona:**

- Crear pago: `POST /api/v1/integrations/payment-links` (`SingleUse`, título `"{numeroPago} - {descripción}"` recortado a 128). PADI no es idempotente, así que no se reintenta nunca. `Pago.IdExterno` guarda el id del **link** y `LinkPago` el `checkoutUrl`, que el cliente abre en una pestaña nueva.
- Consultar (conciliación y confirmación del webhook): `GET payment-links/{id}` más `GET received-payments?limit=100`. Un pago `Succeeded` del link es `APROBADO`; un link `Expired` o `Cancelled` sin pago exitoso es `CANCELADO`; lo demás es `PENDIENTE`. Un intento `Failed` con el link activo sigue `PENDIENTE`, porque el cliente puede reintentar en PADI.
- Webhook: PADI avisa en `POST {Pagos:UrlBaseApi}/api/webhooks/padi` sin API key. El endpoint valida `X-Padi-Signature` (HMAC-SHA256 en hex del cuerpo crudo con el secreto, comparado en tiempo constante): 401 si falta o no coincide, 404 si PADI no está activo, 200 sin procesar para eventos que no sean `payment.succeeded`. El aviso se aplica con el mismo `WebhookPagoService` de `pasarela1`; con `ConfirmarWebhook=true` (default) se vuelve a consultar a PADI antes de aprobar.

**Configurar el webhook en PADI** (una vez por ambiente, con la clave de comercio):

```bash
curl -X PUT https://padi.runasp.net/api/v1/integrations/webhook   -H "X-Api-Key: $INTEGRACIONES_PASARELA1_APIKEY" -H "Content-Type: application/json"   -d "{\"webhookUrl\":\"https://api.nexaseguros.me/api/webhooks/padi\",\"webhookSecret\":\"$INTEGRACIONES_PASARELA1_WEBHOOK_SECRET\"}"
```

La URL tiene que ser HTTPS pública: en local PADI no puede avisar, y el pago se confirma con la conciliación (`POST /api/pagos/{id}/conciliar`).

**Límites conocidos de la API de PADI:** `received-payments` devuelve como máximo los últimos 100 pagos y no tiene cursor, así que un pago más viejo no se ve al consultar (queda `PENDIENTE` y lo resuelve el webhook). La doc no dice si PADI reintenta los avisos fallidos.

## Pasar un servicio de mock a real

1. El otro grupo publica su API y nos pasa URL base, clave y contrato.
2. Cargar `BaseUrl` y la clave en el entorno (nunca en el repo).
3. Poner `Integraciones:<Servicio>:UsarMock=false` y arrancar la API.
4. Correr `TodasLasInterfacesExternasTienenMockYReal`: comprueba que el cliente real queda registrado.
5. Recorrer `backend/http/flujo-completo.http` contra el entorno del otro grupo.
6. Actualizar la columna "Estado" de esta tabla.

## Verificación

- `backend/Aseguradora.Tests/EndToEnd/IntegracionesRegistroTests.cs`: cada interfaz tiene mock y real. Si se agrega una interfaz a `Application/External`, el test falla hasta sumarla acá y en el test.
- `backend/Aseguradora.Tests/EndToEnd/FlujoCompletoTests.cs`: el flujo completo con los mocks (requiere Docker: `ASEGURADORA_TESTS_DOCKER=1`).
- `backend/http/flujo-completo.http`: el mismo flujo a mano contra la API local.
