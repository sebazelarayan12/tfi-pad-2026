# Cotización externa — US-F2-07

`POST /api/externo/cotizaciones` requiere `X-Api-Key` y devuelve 201 con una cotización por plan compatible (CU09, RN05 y RN06).

## Estado del contrato

La respuesta implementada es una propuesta pendiente de aceptación por Ventas de motos y la Municipalidad: cada opción tiene su propio idCotizacion, sin id superior. Adjuntar enlaces a ambas confirmaciones en el PR #57 antes de cerrar esta decisión.

## Prueba manual local antes del PR

Prueba manual local confirmada por la persona responsable el **2026-11-01**, mediante Swagger y autenticación `X-Api-Key`. Confirmó que los pasos de prueba funcionaron correctamente y adjuntó capturas de ambos casos válidos:

| Uso | HTTP | RC | TC |
| --- | --- | --- | --- |
| PARTICULAR | 201 | 10.920,00 | 16.380,00 |
| COMERCIAL | 201 | 15.288,00 | 22.932,00 |

Las capturas muestran dos opciones (sin TR), un `idCotizacion` por opción, ausencia de datos de cliente/vehículo y vencimientos UTC el 2026-11-16 para solicitudes del 2026-11-01. Las primas comerciales equivalen a las particulares multiplicadas por 1,40. Los casos negativos quedaron confirmados por el usuario; las capturas aportadas corresponden a los dos casos 201.

Para repetir la prueba, abrí Docker Desktop y, desde la raíz del repositorio, con el `.env` local configurado:

```powershell
$env:SWAGGER_HABILITADO="true"
docker compose up -d --build --wait
```

Abrí http://localhost:8080/swagger y autorizá el esquema ApiKey con una clave configurada en tu `.env` (`APIKEY_PASARELA1` o `APIKEY_PASARELA2`). No copies claves a archivos versionados ni al PR.

Ejecutá `POST /api/externo/cotizaciones` con:

```json
{
  "tipoVehiculo": "MOTO",
  "anio": 2024,
  "uso": "PARTICULAR",
  "edadConductor": 23
}
```

Verificá:

- 201 con `fechaVencimiento` UTC a 15 días y `opciones` con `idCotizacion`, `codigoPlan`, `plan` y `primaMensual`. Sin datos de cliente ni vehículo.
- Con año de referencia 2026 y bases del seed sin modificar (RC 12.000, TC 18.000), RC **10.920,00** y TC **16.380,00**, sin TR. Los **9.100,00** del ejemplo 9.5 C corresponden al fixture con RC 10.000, no al seed real.
- Con `uso = "COMERCIAL"`, primas multiplicadas por 1,40: RC **15.288,00**, TC **22.932,00**.
- Sin API key o con clave incorrecta: 401.
- Con `tipoVehiculo = "BICICLETA"`, `"moto"` o un número: 400.
- Con `uso = "particular"`, campos omitidos/null, edad -1/121 o año 1899/año actual + 2: 400 con ProblemDetails.
- Swagger ofrece los enums como strings en mayúsculas.

La persistencia, el origen externo, las referencias null y el caso sin planes compatibles se verifican además con tests SQLite usando el modelo EF real. No desactives planes compartidos para la prueba manual.

Prueba manual confirmada para el PR #57. Adjuntar evidencia con las credenciales del request ocultas y solicitar nuevamente review de Copilot y del revisor. El acuerdo del contrato con los consumidores continúa pendiente.
