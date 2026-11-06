import { zodResolver } from '@hookform/resolvers/zod';
import { isApiError, type LoginResponse } from '@nexa/api';
import { Button, LogoNexa, toast } from '@nexa/ui';
import { useEffect, useRef } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { useCambiarPassword } from '../api/useCambiarPassword';
import { CampoContrasena } from '../components/CampoContrasena';
import { LayoutAcceso } from '../components/LayoutAcceso';
import { RequisitosPassword } from '../components/RequisitosPassword';
import {
  cambiarPasswordSchema,
  type CambiarPasswordFormValues,
  type CambiarPasswordPayload,
} from '../schemas/cambiarPasswordSchema';
import { cerrarSesion, iniciarSesion } from '../sesion/store';

const RUTA_INICIO = '/inicio';
const RUTA_LOGIN = '/login';
const ID_REQUISITOS = 'requisitos-password-nueva';

const MENSAJE_PERMISO = 'No tenés permiso para cambiar la contraseña.';
const MENSAJE_RED = 'No pudimos cambiar la contraseña. Revisá tu conexión e intentá de nuevo.';
const MENSAJE_INESPERADO = 'Ocurrió un error inesperado.';

type CampoCambio = 'passwordActual' | 'passwordNueva';

const MENSAJE_POR_CLAVE: Record<string, { campo: CampoCambio; mensaje: string }> = {
  passwordactual: { campo: 'passwordActual', mensaje: 'Ingresá la contraseña temporal.' },
  passwordnueva: { campo: 'passwordNueva', mensaje: 'Revisá la contraseña nueva.' },
};

/**
 * `/cambiar-password` (US-FE-B-26): cambio obligatorio de la contraseña temporal. Los errores de campo
 * van bajo el campo; los de negocio, el 403 y la red, en toast (FC19). Ninguna contraseña se guarda.
 */
export function CambiarPasswordPage() {
  const navegar = useNavigate();
  const cambio = useCambiarPassword();
  const enviando = useRef(false);

  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    reset,
    watch,
    formState: { errors },
  } = useForm<CambiarPasswordFormValues, unknown, CambiarPasswordPayload>({
    resolver: zodResolver(cambiarPasswordSchema) as Resolver<
      CambiarPasswordFormValues,
      unknown,
      CambiarPasswordPayload
    >,
    defaultValues: { passwordActual: '', passwordNueva: '', repetir: '' },
  });

  useEffect(() => {
    // RHF registra el campo al montar: el foco inicial se pide en el siguiente turno.
    const temporizador = setTimeout(() => setFocus('passwordActual'), 0);
    return () => clearTimeout(temporizador);
  }, [setFocus]);

  const passwordNueva = watch('passwordNueva');

  const alExito = (respuesta: LoginResponse) => {
    if (!iniciarSesion(respuesta)) {
      toast.error(MENSAJE_INESPERADO);
      return;
    }
    reset();
    void navegar(RUTA_INICIO, { replace: true });
  };

  const alError = (error: unknown) => {
    if (isApiError(error) && error.kind === 'http') {
      if (error.status === 400 && error.errors) {
        const claves = Object.keys(error.errors).flatMap((clave) => {
          const encontrada = MENSAJE_POR_CLAVE[clave.toLowerCase()];
          return encontrada ? [encontrada] : [];
        });
        if (claves.length > 0) {
          claves.forEach(({ campo, mensaje }) => setError(campo, { type: 'server', message: mensaje }));
          return;
        }
      }
      if (error.status === 400 && error.detail) {
        toast.error(error.detail);
        setFocus('passwordActual');
        return;
      }
      if (error.status === 403) {
        toast.error(MENSAJE_PERMISO);
        return;
      }
    } else if (isApiError(error) && error.kind === 'red') {
      toast.error(MENSAJE_RED);
      return;
    }
    toast.error(MENSAJE_INESPERADO);
  };

  const enviar = (valores: CambiarPasswordPayload) => {
    if (enviando.current) return;
    enviando.current = true;
    cambio.mutate(
      { passwordActual: valores.passwordActual, passwordNueva: valores.passwordNueva },
      {
        onSuccess: alExito,
        onError: alError,
        onSettled: () => {
          enviando.current = false;
        },
      },
    );
  };

  const cerrar = () => {
    cerrarSesion('manual');
    void navegar(RUTA_LOGIN, { replace: true });
  };

  const bloqueado = cambio.isPending;

  return (
    <LayoutAcceso>
      <form noValidate onSubmit={(evento) => void handleSubmit(enviar)(evento)}>
        <div className="flex flex-col gap-sp-24">
          <LogoNexa />
          <div className="flex flex-col gap-sp-8">
            <h1 className="text-h1 text-text-primary">Cambiá tu contraseña</h1>
            <p className="text-body-sm text-text-secondary">
              Es tu primer ingreso. Elegí una contraseña nueva para seguir.
            </p>
          </div>
          <div className="flex flex-col gap-sp-16">
            <CampoContrasena
              label="Contraseña temporal"
              autoComplete="current-password"
              disabled={bloqueado}
              error={errors.passwordActual !== undefined}
              {...(errors.passwordActual?.message ? { helper: errors.passwordActual.message } : {})}
              {...register('passwordActual')}
            />
            <CampoContrasena
              label="Contraseña nueva"
              autoComplete="new-password"
              disabled={bloqueado}
              aria-describedby={ID_REQUISITOS}
              error={errors.passwordNueva !== undefined}
              {...(errors.passwordNueva?.message ? { helper: errors.passwordNueva.message } : {})}
              {...register('passwordNueva')}
            />
            <RequisitosPassword id={ID_REQUISITOS} valor={passwordNueva} />
            <CampoContrasena
              label="Repetir contraseña nueva"
              autoComplete="new-password"
              disabled={bloqueado}
              error={errors.repetir !== undefined}
              {...(errors.repetir?.message ? { helper: errors.repetir.message } : {})}
              {...register('repetir')}
            />
          </div>
          <div className="flex flex-col gap-sp-8">
            <Button
              type="submit"
              label={bloqueado ? 'Cambiando contraseña…' : 'Cambiar contraseña'}
              variant="primary"
              size="m"
              disabled={bloqueado}
              aria-busy={bloqueado}
              className="w-full"
            />
            <Button
              type="button"
              label="Cerrar sesión"
              variant="secondary"
              size="m"
              onClick={cerrar}
              className="w-full"
            />
          </div>
        </div>
      </form>
    </LayoutAcceso>
  );
}
