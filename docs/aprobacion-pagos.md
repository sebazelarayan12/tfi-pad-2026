# US-F4-02: aprobación y facturación

Los originadores crean Pago.CrearPendiente, lo agregan al repositorio y llaman
IAprobacionPagoService.AprobarAsync. La operación devuelve el pago aprobado.
Las cuotas y el pago se guardan juntos. Después se reevalúan todas las pólizas
afectadas y se solicita la factura. Una repetición del mismo pago aprobado no
vuelve a cobrar ni a llamar a ARCA.

IVA incluido según C8: neto = Round(total / 1.21, 2, AwayFromZero), IVA = total - neto.
Ejemplo 9.2: 51250.00 = 42355.37 + 8894.63. Nunca se suma otro 21 % al cobro.

Agregar al .env local los datos fiscales de prueba acordados con ARCA:
FACTURACION_CUIT y FACTURACION_PUNTO_VENTA. Compose los mapea a Facturacion:Cuit y
Facturacion:PuntoVenta. .env.example contiene solo placeholders.

La factura se persiste pendiente antes de llamar a ARCA. ExternalServiceException
no revierte el pago: quedan Numero vacío, CAE nulo y estado PendienteCae.
IFacturacionService.EmitirAsync permite reintentar esa misma factura (US-F4-09).
No hay nuevos endpoints en esta tarea: caja y consultas son US-F4-03.

Si una cuota ya estaba pagada por otro cobro, se aprueba el pago entrante como
excedente, no se modifican cuotas ni se factura y se registra
PAGO_DUPLICADO_REQUIERE_REVISION. La devolución es manual (default C8).
SQL Server genera RowVersion para Pago y Cuota: si otro contexto guardó antes,
UnitOfWork traduce el conflicto a BusinessRuleException y la transacción perdedora
no persiste el pago ni la modificación de cuotas.

## Validación

Desde la raíz: dotnet test backend --filter FullyQualifiedName~Aseguradora.Tests.Pagos
Para verificar RowVersion en SQL Server temporal:
PowerShell: $env:ASEGURADORA_TESTS_DOCKER="1"; dotnet test backend --filter FullyQualifiedName~ConcurrenciaCuotaTests
Git Bash: ASEGURADORA_TESTS_DOCKER=1 dotnet test backend --filter FullyQualifiedName~ConcurrenciaCuotaTests

Prueba manual del stack (por el responsable antes del PR):
1. Configurar los datos fiscales de prueba en .env.
2. docker compose up -d --build --wait
3. docker compose ps: api y sqlserver healthy.
4. curl.exe http://127.0.0.1:8080/health: Healthy.
5. Confirmar que la migración AddPagoCuotaRowVersion se aplicó sin errores.
