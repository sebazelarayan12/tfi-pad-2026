import { zodResolver } from '@hookform/resolvers/zod';
import { AlertaError, Button, Input, LogoNexa } from '@nexa/ui';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useLocation } from 'react-router-dom';

import { clasificarErrorLogin, useLogin, type CampoLogin } from '../api/useLogin';
import { CampoContrasena } from '../components/CampoContrasena';
import { LayoutAcceso } from '../components/LayoutAcceso';
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
    <LayoutAcceso>
      <form noValidate onSubmit={(evento) => void handleSubmit(enviar)(evento)}>
        <div className="flex flex-col gap-sp-24">
          <LogoNexa />
          <div className="flex flex-col gap-sp-8">
            <h1 className="text-h1 text-text-primary">Ingresar al panel</h1>
            <p className="text-body-sm text-text-secondary">
              Acceso para empleados y administradores de Nexa Seguros.
            </p>
          </div>
          {estado.motivo === 'sesionVencida' ? (
            <AlertaError>{MENSAJE_SESION_VENCIDA}</AlertaError>
          ) : null}
          <div className="flex flex-col gap-sp-24">
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
          <Button
            type="submit"
            label="Ingresar"
            variant="primary"
            size="m"
            disabled={bloqueado}
            aria-busy={bloqueado}
            className="w-full"
          />
          {alerta === 'credenciales' ? <AlertaError>{MENSAJE_CREDENCIALES}</AlertaError> : null}
          {alerta === 'generico' ? <AlertaError>{MENSAJE_GENERICO}</AlertaError> : null}
        </div>
      </form>
      <p className="mt-sp-24 text-body-sm text-text-secondary">
        ¿Sos de otro grupo y querés usar la API?{' '}
        <Link to={RUTA_INGRESO_GRUPO} className="text-text-primary underline">
          Ingresá a Integraciones
        </Link>
      </p>
    </LayoutAcceso>
  );
}
