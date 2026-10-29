# Integraciones de pagos (US-F4-01)

Los mocks se activan por defecto y conservan los datos en memoria hasta reiniciar la API.
Cada proveedor tiene su propia instancia. Los pagos permanecen PENDIENTE; los endpoints
y el procesamiento de webhooks corresponden a las siguientes tareas.

Configuración: Integraciones:Arca e Integraciones:Pasarelas:pasarela1/pasarela2.
Cada sección admite UsarMock, BaseUrl y ApiKey. Las claves se suministran por entorno,
por ejemplo Integraciones__Arca__ApiKey e Integraciones__Pasarelas__pasarela1__ApiKey.
No se necesitan credenciales para los mocks. UsarMock=false falla al registrar los
servicios hasta que US-F4-08 publique los clientes HTTP.

Los contratos usan las propiedades C# habituales y la serialización camelCase
predeterminada de ASP.NET Core. La factura rechaza neto + IVA distinto del total.
El número de comprobante es secuencial en memoria; el CAE es determinista por referencia.
Las URLs de checkout usan dominios .example de prueba y no procesan cobros.

## Prueba local

1. Con Docker Desktop activo y el .env local configurado, ejecutar
   `docker compose up -d --build --wait`.
2. Verificar `docker compose ps` y `curl.exe http://127.0.0.1:8080/health`.
3. Confirmar que api y sqlserver estén healthy y /health devuelva Healthy.
4. Los contratos se verifican con `dotnet test backend --filter FullyQualifiedName~Aseguradora.Tests.Pagos`.

