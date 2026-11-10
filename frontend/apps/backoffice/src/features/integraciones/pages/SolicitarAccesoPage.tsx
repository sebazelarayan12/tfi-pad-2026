import { zodResolver } from '@hookform/resolvers/zod';
import { isApiError } from '@nexa/api';
import { AlertaError, Button, Input, LogoNexa } from '@nexa/ui';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';

import { CampoContrasena, LayoutAcceso } from '../../auth';
import { useRegistrarGrupo } from '../api/useRegistrarGrupo';
import { RUTA_INGRESO_GRUPO } from '../rutas';
import {
  registroGrupoSchema,
  type RegistroGrupoPayload,
  type RegistroGrupoValues,
} from '../schemas/registroGrupoSchema';

const MENSAJE_LIMITE = 'Hiciste demasiados intentos. Volvé a probar en un minuto.';
const MENSAJE_GENERICO = 'No pudimos crear la solicitud. Probá de nuevo en unos minutos.';

/** El `detail` del back es el motivo de negocio (email o nombre repetidos, contraseña débil). */
function mensajeDelError(error: unknown): string {
  if (!isApiError(error) || error.kind !== 'http') return MENSAJE_GENERICO;
  if (error.status === 429) return MENSAJE_LIMITE;
  if (error.status === 400 && error.detail) return error.detail;
  return MENSAJE_GENERICO;
}

function SolicitudEnviada() {
  return (
    <LayoutAcceso>
      <div className="flex flex-col gap-sp-24">
        <LogoNexa />
        <div className="flex flex-col gap-sp-8">
          <h1 className="text-h1 text-text-primary">Solicitud enviada</h1>
          <p className="text-body-sm text-text-secondary">
            Creamos tu cuenta. Un administrador de Nexa Seguros revisa tu pedido: cuando lo apruebe,
            vas a poder generar tu clave desde Integraciones.
          </p>
        </div>
        <Link to={RUTA_INGRESO_GRUPO} className="text-body-sm text-text-primary underline">
          Ingresar a mi cuenta
        </Link>
      </div>
    </LayoutAcceso>
  );
}

/** Registro de un grupo externo: crea la cuenta y la solicitud de acceso a la API. */
export function SolicitarAccesoPage() {
  const registrar = useRegistrarGrupo();
  const [alerta, setAlerta] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistroGrupoValues, unknown, RegistroGrupoPayload>({
    resolver: zodResolver(registroGrupoSchema),
    defaultValues: {
      nombre: '',
      contacto: '',
      email: '',
      descripcion: '',
      password: '',
      confirmacion: '',
    },
  });

  if (registrar.isSuccess) return <SolicitudEnviada />;

  const enviar = ({ confirmacion: _confirmacion, ...cuerpo }: RegistroGrupoPayload) => {
    setAlerta(null);
    registrar.mutate(cuerpo, { onError: (error) => setAlerta(mensajeDelError(error)) });
  };

  const bloqueado = registrar.isPending;
  const ayuda = (campo: keyof RegistroGrupoValues) =>
    errors[campo]?.message ? { helper: errors[campo]?.message } : {};

  return (
    <LayoutAcceso>
      <form noValidate onSubmit={(evento) => void handleSubmit(enviar)(evento)}>
        <div className="flex flex-col gap-sp-24">
          <LogoNexa />
          <div className="flex flex-col gap-sp-8">
            <h1 className="text-h1 text-text-primary">Solicitar acceso a la API</h1>
            <p className="text-body-sm text-text-secondary">
              Creá la cuenta de tu grupo. Un administrador aprueba el pedido y después generás tu
              clave.
            </p>
          </div>
          <div className="flex flex-col gap-sp-16">
            <Input
              label="Nombre del grupo"
              autoComplete="organization"
              disabled={bloqueado}
              error={errors.nombre !== undefined}
              {...ayuda('nombre')}
              {...register('nombre')}
            />
            <Input
              label="Persona de contacto"
              autoComplete="name"
              disabled={bloqueado}
              error={errors.contacto !== undefined}
              {...ayuda('contacto')}
              {...register('contacto')}
            />
            <Input
              label="Email"
              type="email"
              autoComplete="username"
              disabled={bloqueado}
              error={errors.email !== undefined}
              {...ayuda('email')}
              {...register('email')}
            />
            <Input
              label="¿Para qué vas a usar la API?"
              disabled={bloqueado}
              error={errors.descripcion !== undefined}
              {...ayuda('descripcion')}
              {...register('descripcion')}
            />
            <CampoContrasena
              label="Contraseña"
              autoComplete="new-password"
              disabled={bloqueado}
              error={errors.password !== undefined}
              helper={
                errors.password?.message ??
                '12 caracteres o más, con mayúscula, minúscula, número y símbolo.'
              }
              {...register('password')}
            />
            <CampoContrasena
              label="Repetí la contraseña"
              autoComplete="new-password"
              disabled={bloqueado}
              error={errors.confirmacion !== undefined}
              {...ayuda('confirmacion')}
              {...register('confirmacion')}
            />
          </div>
          <Button
            type="submit"
            label="Enviar solicitud"
            variant="primary"
            size="m"
            disabled={bloqueado}
            aria-busy={bloqueado}
            className="w-full"
          />
          {alerta ? <AlertaError>{alerta}</AlertaError> : null}
          <p className="text-body-sm text-text-secondary">
            ¿Ya tenés cuenta?{' '}
            <Link to={RUTA_INGRESO_GRUPO} className="text-text-primary underline">
              Ingresá
            </Link>
          </p>
        </div>
      </form>
    </LayoutAcceso>
  );
}
