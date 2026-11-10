namespace Aseguradora.Application.Grupos;

/// <summary>Hashes and checks the passwords of external group accounts.</summary>
public interface IHasherPasswordGrupo
{
    string Hash(string password);

    bool Verificar(string hash, string password);
}
