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

## Correcciones de revisión del PR 26

La API valida Facturacion:Cuit y Facturacion:PuntoVenta al iniciar mediante ValidateOnStart.
Sin esos valores no arranca; completar .env antes de recrear el stack.
Un pago aprobado sin factura puede recuperarse con AprobarAsync: reevalúa las pólizas
y emite la factura sin volver a pagar las cuotas. Si ya existe factura, incluso pendiente,
AprobarAsync no llama a ARCA; los reintentos pendientes siguen siendo de US-F4-09.
Los duplicados totales o parciales se persisten con RequiereRevisionPorDuplicado y
no se facturan durante la recuperación. Se mantiene el default C8: las cuotas aún
pendientes no cambian y el excedente requiere revisión manual del equipo. Cambiar
esa regla necesita un PR docs separado. La migración AddPagoRevisionDuplicado agrega
una columna bit con default false; no elimina datos.
La respuesta aprobada de ARCA se registra con número, CAE, vencimiento y pago antes
de validarla y guardarla. Los errores posteriores dejan un registro para conciliación
manual; esto no sustituye la idempotencia que debe acordarse con ARCA real.
El job concurrencia-sqlserver ejecuta el escenario real de RowVersion con Docker.

Las nuevas pruebas de revisión están pendientes de ejecución por Fernando.
