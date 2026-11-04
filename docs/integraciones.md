# Integraciones externas

Estado de los servicios de otros grupos y cómo pasar de mock a real (US-T-04). Cada servicio vive detrás de una interfaz de `Application/External`; el selector `Integraciones:<Servicio>:UsarMock` elige la implementación al arrancar (`AgregarIntegracion`, US-T-02).

## Los 5 servicios

| Servicio | Interfaz | Clave de configuración | Mock | Real | Responsable | Estado |
|----------|----------|------------------------|------|------|-------------|--------|
| Renaper | `IRenaperService` | `Integraciones:Renaper` | `RenaperMockService` | `RenaperHttpService` | Un grupo confirmado | Mock; real pendiente de que publiquen su API |
| DNRPA | `IDnrpaService` | `Integraciones:Dnrpa` | `DnrpaMockService` | `DnrpaHttpService` | Sin grupo | Mock definitivo (no hay servicio real accesible) |
| ARCA | `IArcaService` | `Integraciones:Arca` | `ArcaMockService` | `ArcaHttpService` | Un grupo confirmado | Mock; real pendiente. Plan B: AFIP en homologación |
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
