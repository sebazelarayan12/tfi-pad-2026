namespace Aseguradora.Tests.Fixtures;

/// <summary>
/// Shares one SQL Server container between every class marked
/// <c>[Collection(SqlServerCollection.Nombre)]</c>.
/// </summary>
[CollectionDefinition(Nombre)]
public sealed class SqlServerCollection : ICollectionFixture<SqlServerContainerFixture>
{
    public const string Nombre = "SqlServer";
}
