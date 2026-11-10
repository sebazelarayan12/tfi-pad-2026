import { zodResolver } from '@hookform/resolvers/zod';
import { isApiError } from '@nexa/api';
import { AlertaError, Button, Input, LogoNexa } from '@nexa/ui';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate } from 'react-router-dom';

import { CampoContrasena, LayoutAcceso, useSesion } from '../../auth';
import { useIngresoGrupo } from '../api/useIngresoGrupo';
import {
  loginGrupoSchema,
  type LoginGrupoPayload,
  type LoginGrupoValues,
} from '../schemas/registroGrupoSchema';
import { RUTA_INTEGRACIONES, RUTA_REGISTRO_GRUPO } from '../rutas';

const MENSAJE_CREDENCIALES = 'Email o contraseña incorrectos.';
const MENSAJE_LIMITE = 'Hiciste demasiados intentos. Volvé a probar en un minuto.';
const MENSAJE_GENERICO = 'No pudimos iniciar sesión. Probá de nuevo en unos minutos.';

function mensajeDelError(error: unknown): string {
  if (!isApiError(error) || error.kind !== 'http') return MENSAJE_GENERICO;
  if (error.status === 401) return MENSAJE_CREDENCIALES;
  if (error.status === 429) return MENSAJE_LIMITE;
  return MENSAJE_GENERICO;
}

/** Ingreso de un grupo externo: abre el panel de integraciones, no el backoffice. */
export function IngresoGrupoPage() {
  const sesion = useSesion();
  const ingreso = useIngresoGrupo();
  const [alerta, setAlerta] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginGrupoValues, unknown, LoginGrupoPayload>({
    resolver: zodResolver(loginGrupoSchema),
    defaultValues: { email: '', password: '' },
  });

  if (sesion !== null) return <Navigate to={RUTA_INTEGRACIONES} replace />;

  const enviar = (valores: LoginGrupoPayload) => {
    setAlerta(null);
    ingreso.mutate(valores, {
      onError: (error) => {
        setValue('password', '');
        setAlerta(mensajeDelError(error));
      },
    });
  };

  const bloqueado = ingreso.isPending;

  return (
    <LayoutAcceso>
      <form noValidate onSubmit={(evento) => void handleSubmit(enviar)(evento)}>
        <div className="flex flex-col gap-sp-24">
          <LogoNexa />
          <div className="flex flex-col gap-sp-8">
            <h1 className="text-h1 text-text-primary">Ingresar a Integraciones</h1>
            <p className="text-body-sm text-text-secondary">
              Para grupos que consumen la API de Nexa Seguros.
            </p>
          </div>
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
            <CampoContrasena
              label="Contraseña"
              autoComplete="current-password"
              disabled={bloqueado}
              error={errors.password !== undefined}
              {...(errors.password?.message ? { helper: errors.password.message } : {})}
              {...register('password')}
            />
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
          {alerta ? <AlertaError>{alerta}</AlertaError> : null}
          <p className="text-body-sm text-text-secondary">
            ¿Todavía no tenés cuenta?{' '}
            <Link to={RUTA_REGISTRO_GRUPO} className="text-text-primary underline">
              Solicitá acceso
            </Link>
          </p>
        </div>
      </form>
    </LayoutAcceso>
  );
}
