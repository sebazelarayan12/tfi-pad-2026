# API para otros grupos — Nexa Seguros

Guía para los grupos que necesitan consultar datos de la aseguradora desde su propio sistema (por ejemplo, un estacionamiento que quiere saber si un vehículo tiene seguro vigente).

## Resumen

| | |
| --- | --- |
| URL base | `https://api.nexaseguros.me` |
| Formato | JSON, nombres de campo en `camelCase`, fechas `yyyy-MM-dd` |
| Autenticación | Header `X-Api-Key` con la clave de tu grupo (la generás vos en el backoffice, pestaña Integraciones) |
| Servicios | [Seguro vigente por patente](#1-seguro-vigente-por-patente) · [Deuda por DNI](#2-deuda-de-un-cliente-por-dni) · [Cotización externa](#3-cotización-externa) |

Todos los servicios son de solo consulta, salvo la cotización, que calcula precios y no requiere datos de un cliente.

## Cómo obtener tu clave

Es autoservicio. Entrás al backoffice de Nexa Seguros, en la pestaña **Integraciones**:

1. **Pedí el alta.** En la pantalla de ingreso, elegí "Ingresá a Integraciones" y luego "Solicitar acceso". Completá el nombre del grupo, un contacto, tu email, para qué vas a usar la API y una contraseña (12 caracteres o más, con mayúscula, minúscula, número y símbolo).
2. **Esperá la aprobación.** Un administrador de Nexa revisa la solicitud. Mientras tanto podés ingresar y ver el estado; si la rechaza, vas a ver el motivo.
3. **Generá tu clave.** Con la solicitud aprobada, ingresá a Integraciones y tocá "Generar clave". La clave tiene el formato `nxk_...`.

- **La clave se muestra una sola vez.** Copiala en ese momento: en Nexa guardamos solo una huella (SHA-256), no podemos recuperarla. Después ves únicamente su inicio, para distinguirla.
- Hay **una clave activa por grupo**. Si generás otra, la anterior deja de funcionar al instante; la pantalla te pide confirmar.
- Si se filtra, generá una nueva. Si Nexa revoca tu acceso, la clave deja de funcionar y se muestra el motivo.
- Guardala como variable de entorno o secreto de tu backend. **No la pongas en un front, en el repositorio ni en un chat grupal**: cualquiera con la clave consulta en nombre de tu grupo.
- La clave va en el header `X-Api-Key`, nunca en la URL.

La misma pestaña Integraciones trae la documentación de los endpoints con ejemplos de pedido y respuesta.

## Autenticación

Todos los pedidos llevan el header:

```http
X-Api-Key: <la clave de tu grupo>
```

Sin el header, o con una clave incorrecta, la API responde **401** con el cuerpo vacío.

## 1. Seguro vigente por patente

Responde si un vehículo tiene una póliza vigente **hoy** (fecha de Argentina).

```http
GET /api/externo/vehiculos/{patente}/seguro-vigente
X-Api-Key: <clave>
```

La patente puede venir en mayúsculas o minúsculas y con espacios: `ab 123 cd` se interpreta como `AB123CD`. Formatos válidos: `AB123CD` (Mercosur) y `ABC123`.

### Con seguro vigente

```http
GET /api/externo/vehiculos/AB123CD/seguro-vigente
```

```json
{
  "patente": "AB123CD",
  "tieneSeguro": true,
  "numeroPoliza": "POL-0000001",
  "plan": "Terceros Completo",
  "vigenteDesde": "2026-11-01",
  "vigenteHasta": "2027-10-31"
}
```

### Sin seguro vigente

```json
{
  "patente": "ZZ999ZZ",
  "tieneSeguro": false
}
```

Un vehículo que no está cargado en nuestro sistema también responde `tieneSeguro: false`, con **200**. **Nunca responde 404** por falta de póliza: no hace falta distinguir "patente desconocida" de "sin seguro".

### Respuestas

| Código | Cuándo |
| --- | --- |
| 200 | Consulta correcta, con o sin seguro |
| 400 | La patente no tiene un formato válido |
| 401 | Falta la clave o es incorrecta |

Una póliza cuenta como vigente solo si su estado es `Vigente` y hoy está entre su fecha de inicio y de fin. Una póliza `Suspendida`, `Cancelada` o `Vencida` no cuenta.

## 2. Deuda de un cliente por DNI

Devuelve las cuotas impagas de un cliente, para que tu sistema pueda ofrecerle el pago.

```http
GET /api/externo/clientes/{dni}/deuda
X-Api-Key: <clave>
```

```json
{
  "dni": "30123456",
  "cliente": "Nombre Apellido",
  "totalAdeudado": 21525.00,
  "polizas": [
    {
      "numeroPoliza": "POL-0000001",
      "patente": "AB123CD",
      "cuotas": [
        {
          "idCuota": "8f6e0d1a-0000-0000-0000-000000000000",
          "numero": 2,
          "importe": 10500.00,
          "recargo": 525.00,
          "total": 11025.00,
          "vencimiento": "2026-12-10",
          "estado": "Vencida"
        }
      ]
    }
  ]
}
```

No incluye datos de contacto del cliente.

| Código | Cuándo |
| --- | --- |
| 200 | Cliente encontrado (puede no tener deuda) |
| 401 | Falta la clave o es incorrecta |
| 404 | No existe un cliente con ese DNI. El cuerpo trae `codigo: "CLIENTE_NO_ENCONTRADO"` |

## 3. Cotización externa

`POST /api/externo/cotizaciones` calcula las opciones de plan para un vehículo sin necesidad de dar de alta al cliente. El contrato y sus ejemplos están en [`docs/cotizacion-externa.md`](cotizacion-externa.md).

## Errores

Los errores de negocio (400 y 404) usan el formato estándar `application/problem+json`:

```json
{
  "status": 400,
  "detail": "La patente debe tener el formato AB123CD o ABC123."
}
```

Leé `detail` para el motivo. En los 404 puede venir además un campo `codigo` estable (por ejemplo `CLIENTE_NO_ENCONTRADO`) que conviene usar para decidir qué hacer, en lugar de comparar textos.

## Ejemplos

### curl

```bash
curl -H "X-Api-Key: $NEXA_API_KEY" \
  https://api.nexaseguros.me/api/externo/vehiculos/AB123CD/seguro-vigente
```

### JavaScript

```js
const respuesta = await fetch(
  `https://api.nexaseguros.me/api/externo/vehiculos/${encodeURIComponent(patente)}/seguro-vigente`,
  { headers: { 'X-Api-Key': process.env.NEXA_API_KEY } },
);

if (respuesta.status === 401) throw new Error('Clave de Nexa inválida');
if (!respuesta.ok) throw new Error(`Consulta rechazada (${respuesta.status})`);

const { tieneSeguro, vigenteHasta } = await respuesta.json();
```

Hacé las llamadas desde tu **backend**, no desde el navegador, para no exponer la clave.

## Para el equipo de Nexa: aprobar un grupo

Los grupos se gestionan en el backoffice, pestaña **Grupos externos** (solo Administrador).

| Acción | Cuándo | Efecto |
| --- | --- | --- |
| Aprobar | Solicitud pendiente, rechazada o revocada | El grupo puede generar su clave |
| Rechazar | Solicitud pendiente | Pide un motivo, que el grupo ve en su panel |
| Revocar | Grupo aprobado | Pide un motivo; borra la clave: deja de funcionar al instante |

Los estados viajan como número: `0` Pendiente, `1` Aprobada, `2` Rechazada, `3` Revocada.

Endpoints que usa la pantalla:

| Método y ruta | Quién | Para qué |
| --- | --- | --- |
| `POST /api/publico/grupos/registro` | Público (límite RN20) | Pedir el alta |
| `POST /api/publico/grupos/login` | Público (límite RN20) | Ingresar; devuelve un JWT con rol `Grupo` |
| `GET /api/grupos/mi-cuenta` | Grupo | Estado de la solicitud y datos de su clave |
| `POST /api/grupos/mi-cuenta/clave` | Grupo | Generar la clave (única respuesta que la trae completa) |
| `GET /api/grupos` | Administrador | Listar solicitudes (filtro `estado`) |
| `POST /api/grupos/{id}/aprobar`, `/rechazar`, `/revocar` | Administrador | Resolver; rechazar y revocar llevan `{ "motivo": "..." }` |

Notas de diseño:

- El grupo es una entidad aparte (`GrupoExterno`), no un usuario de Identity: no entra a las pantallas de empleados. Su sesión (rol `Grupo`) solo ve Integraciones.
- Las claves de las pasarelas y de ARCA siguen configuradas por variable de entorno (`ApiKeys__<nombre>`); conviven con las de los grupos. Una clave de grupo nunca se confunde con una pasarela (su identidad es `grupo:<id>`).
- Detalle del despliegue en [`docs/despliegue.md`](despliegue.md).
