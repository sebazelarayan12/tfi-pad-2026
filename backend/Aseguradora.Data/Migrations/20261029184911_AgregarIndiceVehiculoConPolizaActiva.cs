using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Aseguradora.Data.Migrations
{
    /// <inheritdoc />
    public partial class AgregarIndiceVehiculoConPolizaActiva : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "UX_Polizas_VehiculoConPolizaActiva",
                table: "Polizas",
                column: "VehiculoId",
                unique: true,
                filter: "[Estado] IN (0, 1, 2)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "UX_Polizas_VehiculoConPolizaActiva",
                table: "Polizas");
        }
    }
}
