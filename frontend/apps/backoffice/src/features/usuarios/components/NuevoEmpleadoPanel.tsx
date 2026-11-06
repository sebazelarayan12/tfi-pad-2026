import { zodResolver } from '@hookform/resolvers/zod';
import { isApiError } from '@nexa/api';
import { AlertaError, Button, Input } from '@nexa/ui';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Controller, useForm, type Resolver } from 'react-hook-form';

import { useCrearUsuario } from '../api/useCrearUsuario';
import {
  crearUsuarioSchema,
  MENSAJES_USUARIO,
  type CrearUsuarioPayload,
} from '../schemas/crearUsuarioSchema';
import type { CampoUsuario, NuevoEmpleadoValues } from '../types/usuarios';
import { PasswordField } from './PasswordField';
import { RolSelector } from './RolSelector';

export interface NuevoEmpleadoPanelHandle {
  /** Botón `Nuevo empleado` de la página (D-B24-01): limpia el formulario y enfoca `Nombre`. */
  reiniciar: () => void;
}

const VALORES_VACIOS: NuevoEmpleadoValues = {
  nombre: '',
  apellido: '',
  email: '',
  password: '',
  rol: undefined,
};

const MENSAJE_EXITO = 'Usuario creado.';
const MENSAJE_SIN_PERMISO = 'No tenés permiso para crear usuarios.';
const MENSAJE_INESPERADO = 'Ocurrió un error inesperado.';

// Los `errors` del back llegan en inglés (PB-15): se mapea por clave y nunca se muestra su texto.
const MENSAJE_POR_CLAVE: Record<CampoUsuario, string> = {
  nombre: MENSAJES_USUARIO.nombreObligatorio,
  apellido: MENSAJES_USUARIO.apellidoObligatorio,
  email: MENSAJES_USUARIO.emailInvalido,
  password: MENSAJES_USUARIO.passwordRechazada,
  rol: MENSAJES_USUARIO.rolInvalido,
};

function camposDelError(errors: Record<string, string[]>): CampoUsuario[] {
  const conocidos = Object.keys(MENSAJE_POR_CLAVE) as CampoUsuario[];
  return Object.keys(errors).flatMap((clave) => {
    const campo = conocidos.find((conocido) => conocido === clave.toLowerCase());
    return campo ? [campo] : [];
  });
}

export const NuevoEmpleadoPanel = forwardRef<NuevoEmpleadoPanelHandle>(
  function NuevoEmpleadoPanel(_props, refExterna) {
    const crear = useCrearUsuario();
    const enviando = useRef(false);
    const [alerta, setAlerta] = useState<string | null>(null);
    const [exito, setExito] = useState(false);
    const [pedidoFoco, setPedidoFoco] = useState(0);

    const {
      register,
      handleSubmit,
      reset,
      setError,
      setFocus,
      control,
      formState: { errors },
    } = useForm<NuevoEmpleadoValues, unknown, CrearUsuarioPayload>({
      // El schema exige `rol`; el formulario arranca sin rol (D-20), por eso el tipo de entrada difiere.
      resolver: zodResolver(crearUsuarioSchema) as Resolver<
        NuevoEmpleadoValues,
        unknown,
        CrearUsuarioPayload
      >,
      defaultValues: VALORES_VACIOS,
    });

    // `reset` vacía los campos registrados: el foco se pide recién después del render.
    useEffect(() => {
      if (pedidoFoco > 0) setFocus('nombre');
    }, [pedidoFoco, setFocus]);

    function limpiar() {
      reset(VALORES_VACIOS);
      crear.reset();
      setAlerta(null);
      setExito(false);
    }

    useImperativeHandle(refExterna, () => ({
      reiniciar: () => {
        limpiar();
        setPedidoFoco((valor) => valor + 1);
      },
    }));

    function alFallar(error: unknown) {
      if (!isApiError(error) || error.kind !== 'http') {
        setAlerta(MENSAJE_INESPERADO);
        return;
      }
      if (error.status === 401) return; // La sesión vencida la resuelve el cliente (T-08).
      if (error.status === 403) {
        setAlerta(MENSAJE_SIN_PERMISO);
        return;
      }
      if (error.status === 400 && error.errors) {
        const campos = camposDelError(error.errors);
        if (campos.length > 0) {
          campos.forEach((campo) =>
            setError(campo, { type: 'server', message: MENSAJE_POR_CLAVE[campo] }),
          );
          setFocus(campos[0] as CampoUsuario);
          return;
        }
      }
      // El `detail` (email repetido, política de Identity) va en la alerta, sin marcar ningún campo.
      setAlerta(error.detail ?? MENSAJE_INESPERADO);
    }

    function enviar(valores: CrearUsuarioPayload) {
      if (enviando.current) return;
      enviando.current = true;
      setAlerta(null);
      setExito(false);
      crear.mutate(valores, {
        onSuccess: () => {
          reset(VALORES_VACIOS);
          crear.reset();
          setExito(true);
          setPedidoFoco((valor) => valor + 1);
        },
        onError: alFallar,
        onSettled: () => {
          enviando.current = false;
        },
      });
    }

    return (
      <form
        noValidate
        aria-labelledby="titulo-nuevo-empleado"
        onSubmit={(evento) => void handleSubmit(enviar)(evento)}
        className="flex w-[360px] shrink-0 flex-col gap-sp-16 border-l border-border-strong p-sp-24"
      >
        <h3 id="titulo-nuevo-empleado" className="text-body font-semibold text-text-primary">
          Nuevo empleado
        </h3>
        <Input
          label="Nombre"
          autoComplete="off"
          error={errors.nombre !== undefined}
          {...(errors.nombre?.message ? { helper: errors.nombre.message } : {})}
          {...register('nombre')}
        />
        <Input
          label="Apellido"
          autoComplete="off"
          error={errors.apellido !== undefined}
          {...(errors.apellido?.message ? { helper: errors.apellido.message } : {})}
          {...register('apellido')}
        />
        <Input
          label="Email"
          type="email"
          autoComplete="off"
          error={errors.email !== undefined}
          {...(errors.email?.message ? { helper: errors.email.message } : {})}
          {...register('email')}
        />
        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <PasswordField
              ref={field.ref}
              name={field.name}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              {...(errors.password?.message ? { mensajeError: errors.password.message } : {})}
            />
          )}
        />
        <RolSelector
          {...register('rol')}
          {...(errors.rol?.message ? { mensajeError: errors.rol.message } : {})}
        />
        {alerta ? <AlertaError>{alerta}</AlertaError> : null}
        <p role="status" className="text-body-sm text-text-secondary">
          {exito ? MENSAJE_EXITO : null}
        </p>
        <div className="mt-auto flex justify-end gap-sp-8 border-t border-border-strong pt-sp-16">
          <Button label="Cancelar" variant="secondary" size="m" onClick={limpiar} />
          <Button
            type="submit"
            label={crear.isPending ? 'Creando usuario…' : 'Crear empleado'}
            variant="primary"
            size="m"
            disabled={crear.isPending}
            aria-busy={crear.isPending}
          />
        </div>
      </form>
    );
  },
);
