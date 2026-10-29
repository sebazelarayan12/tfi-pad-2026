using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Aseguradora.Data.Migrations
{
    /// <inheritdoc />
    public partial class AgregarControlProcesos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ControlesProceso",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Nombre = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: false),
                    UltimaFechaProcesada = table.Column<DateOnly>(type: "date", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ControlesProceso", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ControlesProceso_Nombre",
                table: "ControlesProceso",
                column: "Nombre",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ControlesProceso");
        }
    }
}
