using Aseguradora.Application.Grupos;
using Aseguradora.Domain.Entities;
using Microsoft.AspNetCore.Identity;

namespace Aseguradora.Data.Identity;

/// <summary>
/// Password hashing for external group accounts, with the same algorithm and work factor as the
/// employee accounts (ASP.NET Core Identity), without putting the groups in the employee tables.
/// </summary>
public sealed class HasherPasswordGrupo : IHasherPasswordGrupo
{
    private readonly PasswordHasher<GrupoExterno> _hasher = new();

    public string Hash(string password) => _hasher.HashPassword(null!, password);

    public bool Verificar(string hash, string password) =>
        _hasher.VerifyHashedPassword(null!, hash, password) != PasswordVerificationResult.Failed;
}
