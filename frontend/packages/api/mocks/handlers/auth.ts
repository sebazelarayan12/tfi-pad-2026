import { http, HttpResponse, passthrough, type HttpHandler } from 'msw';
import type { CambiarPasswordRequest, LoginRequest, LoginResponse } from '../../src/dto/auth';
import { problemaNegocio, problemaValidacion } from '../fixtures/comunes';
import { tokensMockUsuarios } from './usuarios';

// US-FE-T-32 agrega los demás handlers de este dominio.
// US-FE-B-26 (PB-31): usuario de prueba con cambio de contraseña pendiente y su endpoint.
const login = '*/api/auth/login';
const cambiarPassword = '*/api/auth/cambiar-password';

/** Valores ficticios del usuario de prueba, sin credenciales reales. */
export const usuarioMockCambioPendiente = {
  email: 'cambio.pendiente@example.test',
  passwordTemporal: 'Temporal-Mock-1!',
};

const MENSAJE_ACTUAL_INCORRECTA = 'La contraseña actual es incorrecta.';

let passwordVigente = usuarioMockCambioPendiente.passwordTemporal;
let cambioPendiente = true;

/** Deja al usuario de prueba otra vez con la contraseña temporal (para tests). */
export function reiniciarUsuarioMockCambioPendiente(): void {
  passwordVigente = usuarioMockCambioPendiente.passwordTemporal;
  cambioPendiente = true;
}

function respuestaLogin(): LoginResponse {
  return {
    // Token que el handler de `/api/auth/yo` reconoce: con otro, ese 401 cierra la sesión.
    token: tokensMockUsuarios.empleado,
    rol: 'Empleado',
    expiraEn: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    debeCambiarPassword: cambioPendiente,
  };
}

/** Misma política que US-F1-09: 12+, mayúscula, minúscula, número y símbolo. */
function incumplePolitica(password: string): string | null {
  if (password.length < 12) return 'La contraseña debe tener al menos 12 caracteres.';
  if (!/[A-Z]/.test(password)) return 'La contraseña debe incluir al menos una letra mayúscula.';
  if (!/[a-z]/.test(password)) return 'La contraseña debe incluir al menos una letra minúscula.';
  if (!/\d/.test(password)) return 'La contraseña debe incluir al menos un dígito.';
  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'La contraseña debe incluir al menos un carácter no alfanumérico.';
  }
  return null;
}

export const handlers: HttpHandler[] = [
  http.post(login, async ({ request }) => {
    const body = (await request.clone().json()) as LoginRequest;
    // Solo el usuario de prueba: el resto del login lo resuelve el back real.
    if (body.email !== usuarioMockCambioPendiente.email) return passthrough();
    if (body.password !== passwordVigente) {
      return HttpResponse.json(
        { status: 401, title: 'Unauthorized', detail: 'Email o contraseña incorrectos.' },
        { status: 401 },
      );
    }
    return HttpResponse.json(respuestaLogin());
  }),

  http.post(cambiarPassword, async ({ request }) => {
    const body = (await request.json()) as Partial<CambiarPasswordRequest>;
    if (!body.passwordActual || !body.passwordNueva) {
      return HttpResponse.json(
        problemaValidacion({
          ...(body.passwordActual ? {} : { PasswordActual: ['La contraseña actual es obligatoria.'] }),
          ...(body.passwordNueva ? {} : { PasswordNueva: ['La contraseña nueva es obligatoria.'] }),
        }),
        { status: 400 },
      );
    }
    if (body.passwordActual !== passwordVigente) {
      return HttpResponse.json(problemaNegocio(MENSAJE_ACTUAL_INCORRECTA), { status: 400 });
    }
    if (body.passwordNueva === body.passwordActual) {
      return HttpResponse.json(
        problemaNegocio('La contraseña nueva debe ser distinta de la actual.'),
        { status: 400 },
      );
    }
    const incumplida = incumplePolitica(body.passwordNueva);
    if (incumplida !== null) {
      return HttpResponse.json(problemaNegocio(incumplida), { status: 400 });
    }
    passwordVigente = body.passwordNueva;
    cambioPendiente = false;
    return HttpResponse.json(respuestaLogin());
  }),
];
