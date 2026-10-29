using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Aseguradora.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPagoRevisionDuplicado : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "RequiereRevisionPorDuplicado",
                table: "Pagos",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.UpdateData(
                table: "Pagos",
                keyColumn: "Id",
                keyValue: new Guid("e1000000-0000-0000-0000-000000000001"),
                column: "RequiereRevisionPorDuplicado",
                value: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RequiereRevisionPorDuplicado",
                table: "Pagos");
        }
    }
}
