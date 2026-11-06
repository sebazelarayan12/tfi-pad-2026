import { describe, expectTypeOf, it } from 'vitest';

import type {
  LoginRequest,
  LoginResponse,
  PaginaRequest,
  PaginaResponse,
  ProblemDetails,
  RolUsuario,
  ValidationProblemDetails,
} from '../../src/index';

describe('DTO comunes', () => {
  it('ProblemDetails exige status y el resto es opcional o nulo', () => {
    expectTypeOf<ProblemDetails['status']>().toEqualTypeOf<number>();
    expectTypeOf<{ status: number }>().toMatchTypeOf<ProblemDetails>();

    expectTypeOf<ProblemDetails['type']>().toEqualTypeOf<string | null | undefined>();
    expectTypeOf<ProblemDetails['title']>().toEqualTypeOf<string | null | undefined>();
    expectTypeOf<ProblemDetails['detail']>().toEqualTypeOf<string | null | undefined>();
    expectTypeOf<ProblemDetails['instance']>().toEqualTypeOf<string | null | undefined>();
    expectTypeOf<ProblemDetails['traceId']>().toEqualTypeOf<string | null | undefined>();
    expectTypeOf<ProblemDetails['codigo']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<ProblemDetails['errors']>().toEqualTypeOf<Record<string, string[]> | undefined>();

    // @ts-expect-error `status` es obligatorio en ProblemDetails.
    const problemSinStatus: ProblemDetails = {};
    expectTypeOf(problemSinStatus).toEqualTypeOf<ProblemDetails>();
  });

  it('ValidationProblemDetails fija status en 400 y exige errors', () => {
    expectTypeOf<ValidationProblemDetails['status']>().toEqualTypeOf<400>();
    expectTypeOf<ValidationProblemDetails['errors']>().toEqualTypeOf<Record<string, string[]>>();

    const validacion: ValidationProblemDetails = {
      status: 400,
      errors: { Email: ['El email es obligatorio.'] },
    };
    expectTypeOf(validacion).toEqualTypeOf<ValidationProblemDetails>();

    // @ts-expect-error `errors` es obligatorio en el 400 de validación.
    const validacionSinErrors: ValidationProblemDetails = { status: 400 };
    expectTypeOf(validacionSinErrors).toEqualTypeOf<ValidationProblemDetails>();

    // @ts-expect-error el status de validación es 400, no cualquier número.
    const validacionConOtroStatus: ValidationProblemDetails = { status: 500, errors: {} };
    expectTypeOf(validacionConOtroStatus).toEqualTypeOf<ValidationProblemDetails>();
  });

  it('PaginaResponse<T> usa tamanoPagina en la respuesta', () => {
    type Fila = { id: string };

    expectTypeOf<keyof PaginaResponse<Fila>>().toEqualTypeOf<
      'items' | 'pagina' | 'tamanoPagina' | 'total'
    >();
    expectTypeOf<PaginaResponse<Fila>['items']>().toEqualTypeOf<Fila[]>();
    expectTypeOf<PaginaResponse<Fila>['pagina']>().toEqualTypeOf<number>();
    expectTypeOf<PaginaResponse<Fila>['tamanoPagina']>().toEqualTypeOf<number>();
    expectTypeOf<PaginaResponse<Fila>['total']>().toEqualTypeOf<number>();
    expectTypeOf<PaginaResponse<Fila>>().not.toHaveProperty('tamano');
  });

  it('PaginaRequest usa pagina y tamano, ambos opcionales', () => {
    expectTypeOf<keyof PaginaRequest>().toEqualTypeOf<'pagina' | 'tamano'>();
    expectTypeOf<PaginaRequest['pagina']>().toEqualTypeOf<number | undefined>();
    expectTypeOf<PaginaRequest['tamano']>().toEqualTypeOf<number | undefined>();
  });
});

describe('DTO de auth', () => {
  it("RolUsuario es exactamente 'Administrador' | 'Empleado'", () => {
    expectTypeOf<RolUsuario>().toEqualTypeOf<'Administrador' | 'Empleado'>();
  });

  it('LoginResponse tiene las claves token, rol, expiraEn y debeCambiarPassword (opcional, PB-31)', () => {
    expectTypeOf<keyof LoginResponse>().toEqualTypeOf<
      'token' | 'rol' | 'expiraEn' | 'debeCambiarPassword'
    >();
    expectTypeOf<LoginResponse['debeCambiarPassword']>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<LoginResponse['token']>().toEqualTypeOf<string>();
    expectTypeOf<LoginResponse['rol']>().toEqualTypeOf<RolUsuario>();
    expectTypeOf<LoginResponse['expiraEn']>().toEqualTypeOf<string>();
    expectTypeOf<LoginResponse['expiraEn']>().not.toEqualTypeOf<Date>();
  });

  it('LoginRequest exige email y password como string', () => {
    expectTypeOf<keyof LoginRequest>().toEqualTypeOf<'email' | 'password'>();
    expectTypeOf<LoginRequest['email']>().toEqualTypeOf<string>();
    expectTypeOf<LoginRequest['password']>().toEqualTypeOf<string>();

    const login: LoginRequest = { email: 'admin@nexa.test', password: 'Secreta1!' };
    expectTypeOf(login).toEqualTypeOf<LoginRequest>();

    // @ts-expect-error falta `password`.
    const loginSinPassword: LoginRequest = { email: 'admin@nexa.test' };
    expectTypeOf(loginSinPassword).toEqualTypeOf<LoginRequest>();

    // @ts-expect-error `password` debe ser string.
    const loginConPasswordNumerica: LoginRequest = { email: 'admin@nexa.test', password: 123 };
    expectTypeOf(loginConPasswordNumerica).toEqualTypeOf<LoginRequest>();
  });

  it('el barrel src/index.ts reexporta LoginResponse y ProblemDetails', () => {
    expectTypeOf<LoginResponse['token']>().toBeString();
    expectTypeOf<ProblemDetails['status']>().toBeNumber();
  });
});
