# API para otros grupos — Nexa Seguros

Guía para los grupos que necesitan consultar datos de la aseguradora desde su propio sistema (por ejemplo, un estacionamiento que quiere saber si un vehículo tiene seguro vigente).

## Resumen

| | |
| --- | --- |
| URL base | `https://api.nexaseguros.me` |
| Formato | JSON, nombres de campo en `camelCase`, fechas `yyyy-MM-dd` |
| Autenticación | Header `X-Api-Key` con la clave de tu grupo |
| Servicios | [Seguro vigente por patente](#1-seguro-vigente-por-patente) · [Deuda por DNI](#2-deuda-de-un-cliente-por-dni) · [Cotización externa](#3-cotización-externa) |

Todos los servicios son de solo consulta, salvo la cotización, que calcula precios y no requiere datos de un cliente.

## Cómo obtener tu clave

Cada grupo tiene **su propia clave**. Pedila al equipo de Nexa Seguros indicando el nombre del grupo y para qué servicio la vas a usar. Te la pasamos por un canal privado.

- Guardala como variable de entorno o secreto de tu backend. **No la pongas en un front, en el repositorio ni en un chat grupal**: cualquiera con la clave consulta en nombre de tu grupo.
- Si se filtra, avisanos y la reemplazamos. La clave anterior deja de funcionar apenas la cambiamos.
- Las claves se llaman `X-Api-Key` en el header, nunca en la URL.

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

## Para el equipo de Nexa: dar de alta una clave

La API acepta cualquier clave configurada como `ApiKeys__<nombre-del-grupo>`; el nombre identifica al grupo.

1. Generar una clave larga y aleatoria, una por grupo (por ejemplo `openssl rand -base64 32`).
2. Agregar la variable al `.env` de la VM (nunca al repositorio) y al `environment` de la API en `docker-compose.yml` como `ApiKeys__<nombre>: ${APIKEY_<NOMBRE>}`. En `.env.example` va solo un placeholder falso.
3. Reiniciar la API: `docker compose up -d api`.
4. Verificar con `curl` que la clave nueva responde 200 y que sin clave responde 401.
5. Pasarle la clave al grupo por un canal privado.

Para dar de baja o reemplazar una clave, se borra o cambia la variable y se reinicia la API. Detalle del despliegue en [`docs/despliegue.md`](despliegue.md).
