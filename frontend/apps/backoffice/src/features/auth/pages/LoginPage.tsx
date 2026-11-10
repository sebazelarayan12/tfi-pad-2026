import { zodResolver } from '@hookform/resolvers/zod';
import { AlertaError, Button, Input } from '@nexa/ui';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useLocation } from 'react-router-dom';

import { clasificarErrorLogin, useLogin, type CampoLogin } from '../api/useLogin';
import { CampoContrasena } from '../components/CampoContrasena';
import { LayoutLogin } from '../components/LayoutLogin';
import {
  loginSchema,
  MENSAJES_LOGIN,
  type LoginFormValues,
  type LoginPayload,
} from '../schemas/loginSchema';
import { useSesion } from '../sesion/store';

const RUTA_CAMBIAR_PASSWORD = '/cambiar-password';

const RUTA_INICIO = '/inicio';
const RUTA_LOGIN = '/login';

const MENSAJE_CREDENCIALES = 'Email o contraseña incorrectos.';
const MENSAJE_GENERICO = 'No pudimos iniciar sesión. Probá de nuevo en unos minutos.';
const MENSAJE_SESION_VENCIDA = 'Tu sesión venció. Volvé a ingresar.';
// Ruta de la feature integraciones; no se importa de ahí para no crear un ciclo entre features.
const RUTA_INGRESO_GRUPO = '/integraciones/ingreso';

// Los campos de @nexa/ui son claros: sobre el fondo oscuro del login se ajustan desde el formulario,
// sin tocar el primitivo ni las otras pantallas de acceso.
const CAMPOS_OSCUROS = [
  '[&_label]:text-surface-subtle',
  '[&_input]:h-12 [&_input]:border-white/15 [&_input]:bg-white/5 [&_input]:text-action-on-primary',
  '[&_input]:placeholder:text-text-tertiary',
  '[&_input:focus]:border-accent-lime [&_input:focus]:ring-accent-lime',
  '[&_input:disabled]:bg-white/5 [&_input:disabled]:text-text-tertiary',
  '[&_[data-state=error]_input]:border-status-cancelada-bg',
  '[&_p]:text-surface-subtle [&_[data-state=error]_p]:text-status-cancelada-bg',
  '[&_button]:size-12 [&_button]:text-surface-subtle [&_button:focus-visible]:outline-accent-lime',
].join(' ');

const AYUDA_CONTRASENA = '¿Olvidaste tu contraseña? Pedila a un administrador.';

const MENSAJE_POR_CAMPO: Record<CampoLogin, string> = {
  email: MENSAJES_LOGIN.emailInvalido,
  password: MENSAJES_LOGIN.passwordObligatoria,
};

type AlertaAcceso = 'credenciales' | 'generico' | null;

interface EstadoUbicacion {
  desde?: unknown;
  motivo?: unknown;
}

/** Solo rutas internas: evita redirigir a otro sitio con un `state` manipulado. */
function destinoTrasLogin(desde: unknown): string {
  if (typeof desde !== 'string') return RUTA_INICIO;
  const esInterna = desde.startsWith('/') && !desde.startsWith('//') && !desde.includes('\\');
  const esLogin = desde === RUTA_LOGIN || desde.startsWith(`${RUTA_LOGIN}?`);
  return esInterna && !esLogin ? desde : RUTA_INICIO;
}

export function LoginPage() {
  const sesion = useSesion();
  const ubicacion = useLocation();
  const estado = (ubicacion.state ?? {}) as EstadoUbicacion;
  const login = useLogin();
  const [alerta, setAlerta] = useState<AlertaAcceso>(null);
  const campoPendiente = useRef<CampoLogin | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    setFocus,
    formState: { errors },
  } = useForm<LoginFormValues, unknown, LoginPayload>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // Con los campos deshabilitados no se puede enfocar: se espera a que termine la petición.
  useEffect(() => {
    if (login.isPending || campoPendiente.current === null) return;
    setFocus(campoPendiente.current);
    campoPendiente.current = null;
  }, [login.isPending, setFocus]);

  if (sesion !== null) {
    const destino = sesion.debeCambiarPassword
      ? RUTA_CAMBIAR_PASSWORD
      : destinoTrasLogin(estado.desde);
    return <Navigate to={destino} replace />;
  }

  const enviar = (valores: LoginPayload) => {
    setAlerta(null);
    login.mutate(valores, {
      onError: (error) => {
        const resultado = clasificarErrorLogin(error);
        if (resultado.tipo === 'credenciales') {
          setValue('password', '');
          campoPendiente.current = 'email';
          setAlerta('credenciales');
        } else if (resultado.tipo === 'campos') {
          resultado.campos.forEach((campo) =>
            setError(campo, { type: 'server', message: MENSAJE_POR_CAMPO[campo] }),
          );
          campoPendiente.current = resultado.campos[0] ?? 'email';
        } else {
          setAlerta('generico');
        }
      },
    });
  };

  const bloqueado = login.isPending;

  return (
    <LayoutLogin>
      <form noValidate onSubmit={(evento) => void handleSubmit(enviar)(evento)}>
        <div className="flex flex-col gap-sp-24">
          <div className="flex flex-col gap-sp-12 text-center">
            {/* Tamaño propio del login (no está en la escala tipográfica); en mayúsculas por CSS. */}
            <h1 className="text-[56px] font-extrabold uppercase leading-[60px] text-action-on-primary">
              Ingresar al panel
            </h1>
            <p className="text-body text-surface-subtle">
              Acceso para empleados y administradores de Nexa Seguros.
            </p>
          </div>
          {estado.motivo === 'sesionVencida' ? (
            <AlertaError>{MENSAJE_SESION_VENCIDA}</AlertaError>
          ) : null}
          <div className={`flex flex-col gap-sp-24 ${CAMPOS_OSCUROS}`}>
            <Input
              label="Email"
              type="email"
              autoComplete="username"
              disabled={bloqueado}
              error={errors.email !== undefined}
              {...(errors.email?.message ? { helper: errors.email.message } : {})}
              {...register('email')}
            />
            <div className={errors.password ? undefined : '[&_p]:mt-sp-16 [&_p]:text-right'}>
              <CampoContrasena
                label="Contraseña"
                autoComplete="current-password"
                disabled={bloqueado}
                error={errors.password !== undefined}
                helper={errors.password?.message ?? AYUDA_CONTRASENA}
                {...register('password')}
              />
            </div>
          </div>
          <div className="relative">
            {/* Brillo lima bajo el botón (decorativo). */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-sp-24 -bottom-sp-8 h-sp-24 rounded-full bg-accent-lime opacity-40 blur-xl"
            />
            <Button
              type="submit"
              label="Ingresar"
              variant="primary"
              size="m"
              disabled={bloqueado}
              aria-busy={bloqueado}
              className="relative w-full !h-12 font-semibold bg-gradient-to-r from-accent-lime to-accent-lime-soft !text-text-primary focus-visible:!outline-accent-lime"
            />
          </div>
          {alerta === 'credenciales' ? <AlertaError>{MENSAJE_CREDENCIALES}</AlertaError> : null}
          {alerta === 'generico' ? <AlertaError>{MENSAJE_GENERICO}</AlertaError> : null}
        </div>
      </form>
      <p className="mt-sp-32 border-t text-center border-white/15 pt-sp-24 text-body-sm text-surface-subtle">
        ¿Sos de otro grupo y querés usar la API?{' '}
        <Link
          to={RUTA_INGRESO_GRUPO}
          className="rounded-input text-accent-lime underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-lime"
        >
          Ingresá a Integraciones
        </Link>
      </p>
    </LayoutLogin>
  );
}
