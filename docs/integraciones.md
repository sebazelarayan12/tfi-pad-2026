# Integraciones externas

Estado de los servicios de otros grupos y cómo pasar de mock a real (US-T-04). Cada servicio vive detrás de una interfaz de `Application/External`; el selector `Integraciones:<Servicio>:UsarMock` elige la implementación al arrancar (`AgregarIntegracion`, US-T-02).

## Los 5 servicios

| Servicio | Interfaz | Clave de configuración | Mock | Real | Responsable | Estado |
|----------|----------|------------------------|------|------|-------------|--------|
| Renaper | `IRenaperService` | `Integraciones:Renaper` | `RenaperMockService` | `RenaperHttpService` | Grupo OpenRENAPER | Real implementado contra OpenRENAPER (sin clave); activar con `UsarMock=false`. Ver "Particularidades" |
| DNRPA | `IDnrpaService` | `Integraciones:Dnrpa` | `DnrpaMockService` | `DnrpaHttpService` | Sin grupo | Mock definitivo (no hay servicio real accesible) |
| ARCA | `IArcaService` | `Integraciones:Arca` | `ArcaMockService` | `ArcaHttpService` | Grupo FacturAR | Real implementado contra FacturAR; falta su API key para activarlo. Ver "Particularidades" |
| Pasarela 1 | `IPasarelaService` (vía `IPasarelaResolver`) | `Integraciones:Pasarelas:pasarela1` | `PasarelaMockService` | `PasarelaHttpService` | Grupo de la pasarela 1 | Mock; real pendiente |
| Pasarela 2 | `IPasarelaService` (vía `IPasarelaResolver`) | `Integraciones:Pasarelas:pasarela2` | `PasarelaMockService` | `PasarelaHttpService` | Grupo de la pasarela 2 | Mock; real pendiente |

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

**FacturAR** (`POST /v1/comprobantes`, header `X-Api-Key` con una clave `fak_...` y `Idempotency-Key` = número de pago). La empresa emisora sale de la clave, así que `Facturacion:Cuit` no se envía; `Facturacion:PuntoVenta` debe existir y estar activo en su portal. Se emite Factura B (tipo 6) con IVA incluido. No hay consulta por número de comprobante (`ConsultarFacturaAsync` falla), y el PDF no se guarda.

Probado contra facturAR real (09/11/2026): el `documentoTipo` del receptor se manda **por nombre** (`DNI`, `CUIT`, `CUIL`); los códigos numéricos de AFIP (`96` para DNI) responden 400 `CUIT_INVALIDO`. Cuando facturAR rechaza una emisión, la API deja `ARCA_EMISION_FALLIDA` con el motivo en el log y la factura queda `Pendiente CAE`; el reintento automático (cada `FACTURACION_INTERVALO_REINTENTO_MINUTOS`) la emite sola cuando se corrige la causa. El servicio no devuelve PDF: no hay enlace a la factura.

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
