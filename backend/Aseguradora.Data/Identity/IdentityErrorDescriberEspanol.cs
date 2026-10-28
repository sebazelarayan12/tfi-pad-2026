using Microsoft.AspNetCore.Identity;

namespace Aseguradora.Data.Identity;

/// <summary>
/// Spanish descriptions for the <see cref="IdentityResult"/> errors of CU01 and CU03, so the
/// password policy and the rest of the Identity messages match the language of the API
/// (US-F1-03).
/// </summary>
public sealed class IdentityErrorDescriberEspanol : IdentityErrorDescriber
{
    public override IdentityError DefaultError() => Error(
        nameof(DefaultError),
        "Ocurrió un error inesperado.");

    public override IdentityError ConcurrencyFailure() => Error(
        nameof(ConcurrencyFailure),
        "Los datos fueron modificados por otra operación. Volvé a intentarlo.");

    public override IdentityError PasswordMismatch() => Error(
        nameof(PasswordMismatch),
        "La contraseña actual es incorrecta.");

    public override IdentityError InvalidToken() => Error(
        nameof(InvalidToken),
        "El token es inválido.");

    public override IdentityError RecoveryCodeRedemptionFailed() => Error(
        nameof(RecoveryCodeRedemptionFailed),
        "No se pudo canjear el código de recuperación.");

    public override IdentityError LoginAlreadyAssociated() => Error(
        nameof(LoginAlreadyAssociated),
        "Ya existe una cuenta asociada a este inicio de sesión.");

    public override IdentityError InvalidUserName(string? userName) => Error(
        nameof(InvalidUserName),
        $"El nombre de usuario '{userName}' es inválido.");

    public override IdentityError InvalidEmail(string? email) => Error(
        nameof(InvalidEmail),
        $"El email '{email}' es inválido.");

    public override IdentityError DuplicateUserName(string userName) => Error(
        nameof(DuplicateUserName),
        $"El nombre de usuario '{userName}' ya está en uso.");

    public override IdentityError DuplicateEmail(string email) => Error(
        nameof(DuplicateEmail),
        $"El email '{email}' ya está registrado.");

    public override IdentityError InvalidRoleName(string? role) => Error(
        nameof(InvalidRoleName),
        $"El rol '{role}' es inválido.");

    public override IdentityError DuplicateRoleName(string role) => Error(
        nameof(DuplicateRoleName),
        $"El rol '{role}' ya existe.");

    public override IdentityError UserAlreadyHasPassword() => Error(
        nameof(UserAlreadyHasPassword),
        "El usuario ya tiene una contraseña.");

    public override IdentityError UserLockoutNotEnabled() => Error(
        nameof(UserLockoutNotEnabled),
        "El bloqueo de la cuenta no está habilitado.");

    public override IdentityError UserAlreadyInRole(string role) => Error(
        nameof(UserAlreadyInRole),
        $"El usuario ya tiene el rol '{role}'.");

    public override IdentityError UserNotInRole(string role) => Error(
        nameof(UserNotInRole),
        $"El usuario no tiene el rol '{role}'.");

    public override IdentityError PasswordTooShort(int length) => Error(
        nameof(PasswordTooShort),
        $"La contraseña debe tener al menos {length} caracteres.");

    public override IdentityError PasswordRequiresUniqueChars(int uniqueChars) => Error(
        nameof(PasswordRequiresUniqueChars),
        $"La contraseña debe usar al menos {uniqueChars} caracteres distintos.");

    public override IdentityError PasswordRequiresNonAlphanumeric() => Error(
        nameof(PasswordRequiresNonAlphanumeric),
        "La contraseña debe incluir al menos un carácter no alfanumérico.");

    public override IdentityError PasswordRequiresDigit() => Error(
        nameof(PasswordRequiresDigit),
        "La contraseña debe incluir al menos un dígito.");

    public override IdentityError PasswordRequiresLower() => Error(
        nameof(PasswordRequiresLower),
        "La contraseña debe incluir al menos una letra minúscula.");

    public override IdentityError PasswordRequiresUpper() => Error(
        nameof(PasswordRequiresUpper),
        "La contraseña debe incluir al menos una letra mayúscula.");

    private static IdentityError Error(string code, string description) =>
        new() { Code = code, Description = description };
}
