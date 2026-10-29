using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Aseguradora.Data.Migrations
{
    /// <inheritdoc />
    /// <remarks>
    /// Raw SQL instead of HasSequence: the tests build the model on SQLite, which has no sequences.
    /// Starts at 2 because SeedData already inserts POL-0000001 and Polizas.Numero is unique.
    /// </remarks>
    public partial class AgregarSecuenciaNumeroPoliza : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("CREATE SEQUENCE dbo.SeqNumeroPoliza AS bigint START WITH 2 INCREMENT BY 1;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP SEQUENCE dbo.SeqNumeroPoliza;");
        }
    }
}
