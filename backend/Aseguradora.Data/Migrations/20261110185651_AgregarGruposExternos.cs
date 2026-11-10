using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Aseguradora.Data.Migrations
{
    /// <inheritdoc />
    public partial class AgregarGruposExternos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "GruposExternos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Nombre = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Email = table.Column<string>(type: "varchar(256)", unicode: false, maxLength: 256, nullable: false),
                    PasswordHash = table.Column<string>(type: "varchar(256)", unicode: false, maxLength: 256, nullable: false),
                    Contacto = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Estado = table.Column<int>(type: "int", nullable: false),
                    Motivo = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    FechaSolicitud = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaResolucion = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ClaveHash = table.Column<string>(type: "varchar(64)", unicode: false, maxLength: 64, nullable: true),
                    ClavePrefijo = table.Column<string>(type: "varchar(16)", unicode: false, maxLength: 16, nullable: true),
                    ClaveCreadaEn = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GruposExternos", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_GruposExternos_ClaveHash",
                table: "GruposExternos",
                column: "ClaveHash",
                unique: true,
                filter: "[ClaveHash] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_GruposExternos_Email",
                table: "GruposExternos",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GruposExternos_Nombre",
                table: "GruposExternos",
                column: "Nombre",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GruposExternos");
        }
    }
}
