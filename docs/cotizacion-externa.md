# Cotización externa — US-F2-07

`POST /api/externo/cotizaciones` requiere `X-Api-Key` y devuelve 201 con una cotización por plan compatible (CU09, RN05 y RN06).

## Prueba manual local antes del PR

Pendiente de ejecución y confirmación por la persona responsable. Abrí Docker Desktop y, desde la raíz del repositorio, con el `.env` local configurado:

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

Al terminar, confirmá el resultado antes de abrir el PR y pedí review de Copilot.
