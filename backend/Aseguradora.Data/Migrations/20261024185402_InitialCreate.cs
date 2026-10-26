using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Aseguradora.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Clientes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Dni = table.Column<string>(type: "varchar(8)", unicode: false, maxLength: 8, nullable: false),
                    Cuil = table.Column<string>(type: "varchar(11)", unicode: false, maxLength: 11, nullable: false),
                    Nombre = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Apellido = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    FechaNacimiento = table.Column<DateOnly>(type: "date", nullable: false),
                    Sexo = table.Column<string>(type: "char(1)", unicode: false, fixedLength: true, maxLength: 1, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Telefono = table.Column<string>(type: "varchar(20)", unicode: false, maxLength: 20, nullable: true),
                    Calle = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Numero = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Localidad = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Provincia = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    CodigoPostal = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    ValidadoRenaper = table.Column<bool>(type: "bit", nullable: false),
                    FechaValidacionRenaper = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Activo = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Clientes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Planes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Codigo = table.Column<string>(type: "varchar(10)", unicode: false, maxLength: 10, nullable: false),
                    Nombre = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    PrimaBase = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    TiposPermitidos = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: false),
                    AntiguedadMaxima = table.Column<int>(type: "int", nullable: true),
                    Activo = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Planes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RendicionesPagoFacil",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    NombreArchivo = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    FechaRendicion = table.Column<DateOnly>(type: "date", nullable: false),
                    CantidadRegistros = table.Column<int>(type: "int", nullable: false),
                    ImporteTotal = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    FechaProceso = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RendicionesPagoFacil", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Vehiculos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ClienteId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Patente = table.Column<string>(type: "varchar(7)", unicode: false, maxLength: 7, nullable: false),
                    Marca = table.Column<string>(type: "nvarchar(60)", maxLength: 60, nullable: false),
                    Modelo = table.Column<string>(type: "nvarchar(60)", maxLength: 60, nullable: false),
                    Anio = table.Column<int>(type: "int", nullable: false),
                    Tipo = table.Column<int>(type: "int", nullable: false),
                    Uso = table.Column<int>(type: "int", nullable: false),
                    NumeroMotor = table.Column<string>(type: "varchar(30)", unicode: false, maxLength: 30, nullable: false),
                    NumeroChasis = table.Column<string>(type: "varchar(30)", unicode: false, maxLength: 30, nullable: false),
                    ValidadoDnrpa = table.Column<bool>(type: "bit", nullable: false),
                    Activo = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Vehiculos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Vehiculos_Clientes_ClienteId",
                        column: x => x.ClienteId,
                        principalTable: "Clientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Pagos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ClienteId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ImporteTotal = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Numero = table.Column<string>(type: "varchar(20)", unicode: false, maxLength: 20, nullable: false),
                    Medio = table.Column<int>(type: "int", nullable: false),
                    Proveedor = table.Column<string>(type: "varchar(30)", unicode: false, maxLength: 30, nullable: true),
                    Estado = table.Column<int>(type: "int", nullable: false),
                    IdExterno = table.Column<string>(type: "varchar(100)", unicode: false, maxLength: 100, nullable: true),
                    RendicionId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    LinkPago = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaAcreditacion = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Pagos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Pagos_Clientes_ClienteId",
                        column: x => x.ClienteId,
                        principalTable: "Clientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Pagos_RendicionesPagoFacil_RendicionId",
                        column: x => x.RendicionId,
                        principalTable: "RendicionesPagoFacil",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Cotizaciones",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PlanId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ClienteId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    VehiculoId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    TipoVehiculo = table.Column<int>(type: "int", nullable: false),
                    AnioVehiculo = table.Column<int>(type: "int", nullable: false),
                    Uso = table.Column<int>(type: "int", nullable: false),
                    EdadConductor = table.Column<int>(type: "int", nullable: false),
                    PrimaMensual = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    FechaCotizacion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaVencimiento = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Origen = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Cotizaciones", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Cotizaciones_Clientes_ClienteId",
                        column: x => x.ClienteId,
                        principalTable: "Clientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Cotizaciones_Planes_PlanId",
                        column: x => x.PlanId,
                        principalTable: "Planes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Cotizaciones_Vehiculos_VehiculoId",
                        column: x => x.VehiculoId,
                        principalTable: "Vehiculos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Facturas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PagoId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Numero = table.Column<string>(type: "varchar(13)", unicode: false, maxLength: 13, nullable: false),
                    Tipo = table.Column<string>(type: "char(1)", unicode: false, fixedLength: true, maxLength: 1, nullable: false),
                    Importe = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Cae = table.Column<string>(type: "varchar(14)", unicode: false, maxLength: 14, nullable: true),
                    VencimientoCae = table.Column<DateOnly>(type: "date", nullable: true),
                    Estado = table.Column<int>(type: "int", nullable: false),
                    FechaEmision = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Facturas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Facturas_Pagos_PagoId",
                        column: x => x.PagoId,
                        principalTable: "Pagos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Polizas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Numero = table.Column<string>(type: "varchar(12)", unicode: false, maxLength: 12, nullable: false),
                    ClienteId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    VehiculoId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PlanId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CotizacionId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    PrimaMensual = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    VigenciaMeses = table.Column<int>(type: "int", nullable: false),
                    FechaEmision = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaInicio = table.Column<DateOnly>(type: "date", nullable: false),
                    FechaFin = table.Column<DateOnly>(type: "date", nullable: false),
                    Estado = table.Column<int>(type: "int", nullable: false),
                    FechaCancelacion = table.Column<DateTime>(type: "datetime2", nullable: true),
                    MotivoCancelacion = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Polizas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Polizas_Clientes_ClienteId",
                        column: x => x.ClienteId,
                        principalTable: "Clientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Polizas_Cotizaciones_CotizacionId",
                        column: x => x.CotizacionId,
                        principalTable: "Cotizaciones",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Polizas_Planes_PlanId",
                        column: x => x.PlanId,
                        principalTable: "Planes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Polizas_Vehiculos_VehiculoId",
                        column: x => x.VehiculoId,
                        principalTable: "Vehiculos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Cuotas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PolizaId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Numero = table.Column<int>(type: "int", nullable: false),
                    Importe = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Recargo = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    FechaVencimiento = table.Column<DateOnly>(type: "date", nullable: false),
                    Estado = table.Column<int>(type: "int", nullable: false),
                    FechaPago = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Cuotas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Cuotas_Polizas_PolizaId",
                        column: x => x.PolizaId,
                        principalTable: "Polizas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PagoCuotas",
                columns: table => new
                {
                    PagoId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CuotaId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Importe = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PagoCuotas", x => new { x.PagoId, x.CuotaId });
                    table.ForeignKey(
                        name: "FK_PagoCuotas_Cuotas_CuotaId",
                        column: x => x.CuotaId,
                        principalTable: "Cuotas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PagoCuotas_Pagos_PagoId",
                        column: x => x.PagoId,
                        principalTable: "Pagos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "Clientes",
                columns: new[] { "Id", "Activo", "Apellido", "Calle", "CodigoPostal", "Cuil", "Dni", "Email", "FechaNacimiento", "FechaValidacionRenaper", "Localidad", "Nombre", "Numero", "Provincia", "Sexo", "Telefono", "ValidadoRenaper" },
                values: new object[] { new Guid("c1000000-0000-0000-0000-000000000001"), true, "Pérez", "San Martín", "4000", "20301234565", "30123456", "juan.perez@example.com", new DateOnly(1985, 3, 21), new DateTime(2026, 10, 15, 0, 0, 0, 0, DateTimeKind.Utc), "San Miguel de Tucumán", "Juan Carlos", "1234", "Tucumán", "M", null, true });

            migrationBuilder.InsertData(
                table: "Planes",
                columns: new[] { "Id", "Activo", "AntiguedadMaxima", "Codigo", "Descripcion", "Nombre", "PrimaBase", "TiposPermitidos" },
                values: new object[] { new Guid("a1000000-0000-0000-0000-000000000001"), true, null, "RC", "Cubre los daños que se le causan a terceros.", "Responsabilidad Civil", 12000.00m, "Auto,Moto,Camioneta" });

            migrationBuilder.InsertData(
                table: "Pagos",
                columns: new[] { "Id", "ClienteId", "Estado", "FechaAcreditacion", "FechaCreacion", "IdExterno", "ImporteTotal", "LinkPago", "Medio", "Numero", "Proveedor", "RendicionId" },
                values: new object[] { new Guid("e1000000-0000-0000-0000-000000000001"), new Guid("c1000000-0000-0000-0000-000000000001"), 1, new DateTime(2026, 10, 15, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2026, 10, 15, 0, 0, 0, 0, DateTimeKind.Utc), null, 12000.00m, null, 2, "PAG-000001", null, null });

            migrationBuilder.InsertData(
                table: "Vehiculos",
                columns: new[] { "Id", "Activo", "Anio", "ClienteId", "Marca", "Modelo", "NumeroChasis", "NumeroMotor", "Patente", "Tipo", "Uso", "ValidadoDnrpa" },
                values: new object[] { new Guid("b1000000-0000-0000-0000-000000000001"), true, 2021, new Guid("c1000000-0000-0000-0000-000000000001"), "Toyota", "Corolla XEi", "9BRBL3HE5M0123456", "2ZR1234567", "AB123CD", 0, 0, true });

            migrationBuilder.InsertData(
                table: "Polizas",
                columns: new[] { "Id", "ClienteId", "CotizacionId", "Estado", "FechaCancelacion", "FechaEmision", "FechaFin", "FechaInicio", "MotivoCancelacion", "Numero", "PlanId", "PrimaMensual", "VehiculoId", "VigenciaMeses" },
                values: new object[] { new Guid("d1000000-0000-0000-0000-000000000001"), new Guid("c1000000-0000-0000-0000-000000000001"), null, 1, null, new DateTime(2026, 10, 15, 0, 0, 0, 0, DateTimeKind.Utc), new DateOnly(2027, 4, 15), new DateOnly(2026, 10, 15), null, "POL-0000001", new Guid("a1000000-0000-0000-0000-000000000001"), 12000.00m, new Guid("b1000000-0000-0000-0000-000000000001"), 6 });

            migrationBuilder.InsertData(
                table: "Cuotas",
                columns: new[] { "Id", "Estado", "FechaPago", "FechaVencimiento", "Importe", "Numero", "PolizaId", "Recargo" },
                values: new object[,]
                {
                    { new Guid("f1000000-0000-0000-0000-000000000001"), 2, new DateTime(2026, 10, 15, 0, 0, 0, 0, DateTimeKind.Utc), new DateOnly(2026, 11, 10), 12000.00m, 1, new Guid("d1000000-0000-0000-0000-000000000001"), 0m },
                    { new Guid("f1000000-0000-0000-0000-000000000002"), 0, null, new DateOnly(2026, 12, 10), 12000.00m, 2, new Guid("d1000000-0000-0000-0000-000000000001"), 0m },
                    { new Guid("f1000000-0000-0000-0000-000000000003"), 0, null, new DateOnly(2027, 1, 10), 12000.00m, 3, new Guid("d1000000-0000-0000-0000-000000000001"), 0m },
                    { new Guid("f1000000-0000-0000-0000-000000000004"), 0, null, new DateOnly(2027, 2, 10), 12000.00m, 4, new Guid("d1000000-0000-0000-0000-000000000001"), 0m },
                    { new Guid("f1000000-0000-0000-0000-000000000005"), 0, null, new DateOnly(2027, 3, 10), 12000.00m, 5, new Guid("d1000000-0000-0000-0000-000000000001"), 0m },
                    { new Guid("f1000000-0000-0000-0000-000000000006"), 0, null, new DateOnly(2027, 4, 10), 12000.00m, 6, new Guid("d1000000-0000-0000-0000-000000000001"), 0m }
                });

            migrationBuilder.InsertData(
                table: "PagoCuotas",
                columns: new[] { "CuotaId", "PagoId", "Importe" },
                values: new object[] { new Guid("f1000000-0000-0000-0000-000000000001"), new Guid("e1000000-0000-0000-0000-000000000001"), 12000.00m });

            migrationBuilder.CreateIndex(
                name: "IX_Clientes_Dni",
                table: "Clientes",
                column: "Dni",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Clientes_Email",
                table: "Clientes",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Cotizaciones_ClienteId",
                table: "Cotizaciones",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_Cotizaciones_PlanId",
                table: "Cotizaciones",
                column: "PlanId");

            migrationBuilder.CreateIndex(
                name: "IX_Cotizaciones_VehiculoId",
                table: "Cotizaciones",
                column: "VehiculoId");

            migrationBuilder.CreateIndex(
                name: "IX_Cuotas_PolizaId_Numero",
                table: "Cuotas",
                columns: new[] { "PolizaId", "Numero" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Facturas_PagoId",
                table: "Facturas",
                column: "PagoId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PagoCuotas_CuotaId",
                table: "PagoCuotas",
                column: "CuotaId");

            migrationBuilder.CreateIndex(
                name: "IX_Pagos_ClienteId",
                table: "Pagos",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_Pagos_IdExterno",
                table: "Pagos",
                column: "IdExterno",
                unique: true,
                filter: "[IdExterno] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Pagos_Numero",
                table: "Pagos",
                column: "Numero",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Pagos_RendicionId",
                table: "Pagos",
                column: "RendicionId");

            migrationBuilder.CreateIndex(
                name: "IX_Planes_Codigo",
                table: "Planes",
                column: "Codigo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Polizas_ClienteId",
                table: "Polizas",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_Polizas_CotizacionId",
                table: "Polizas",
                column: "CotizacionId",
                unique: true,
                filter: "[CotizacionId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Polizas_Numero",
                table: "Polizas",
                column: "Numero",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Polizas_PlanId",
                table: "Polizas",
                column: "PlanId");

            migrationBuilder.CreateIndex(
                name: "IX_Polizas_VehiculoId",
                table: "Polizas",
                column: "VehiculoId");

            migrationBuilder.CreateIndex(
                name: "IX_RendicionesPagoFacil_NombreArchivo",
                table: "RendicionesPagoFacil",
                column: "NombreArchivo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Vehiculos_ClienteId",
                table: "Vehiculos",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_Vehiculos_Patente",
                table: "Vehiculos",
                column: "Patente",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Facturas");

            migrationBuilder.DropTable(
                name: "PagoCuotas");

            migrationBuilder.DropTable(
                name: "Cuotas");

            migrationBuilder.DropTable(
                name: "Pagos");

            migrationBuilder.DropTable(
                name: "Polizas");

            migrationBuilder.DropTable(
                name: "RendicionesPagoFacil");

            migrationBuilder.DropTable(
                name: "Cotizaciones");

            migrationBuilder.DropTable(
                name: "Planes");

            migrationBuilder.DropTable(
                name: "Vehiculos");

            migrationBuilder.DropTable(
                name: "Clientes");
        }
    }
}
