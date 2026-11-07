import { zodResolver } from '@hookform/resolvers/zod';
import { isApiError, type UsuarioListItemMock } from '@nexa/api';
import { Button, Input, toast } from '@nexa/ui';
import { useRef } from 'react';
import { useForm, type Resolver } from 'react-hook-form';

import { useEditarUsuario } from '../api/useEditarUsuario';
import { MENSAJES_USUARIO } from '../schemas/crearUsuarioSchema';
import { editarUsuarioSchema, type EditarUsuarioPayload } from '../schemas/editarUsuarioSchema';
import { MOTIVO_ULTIMO_ADMINISTRADOR } from '../schemas/reglasUsuario';
import { RolSelector } from './RolSelector';

type CampoEdicion = 'nombre' | 'apellido' | 'rol';

interface EditarUsuarioPanelProps {
  usuario: UsuarioListItemMock;
  /** Es el único administrador activo: no se lo puede pasar a Empleado (D-B25-02). */
  esUltimoAdministrador: boolean;
  onCerrar: () => void;
}

const MENSAJE_EXITO = 'Cambios guardados.';
const MENSAJE_SIN_PERMISO = 'No tenés permiso para editar usuarios.';
const MENSAJE_INESPERADO = 'Ocurrió un error inesperado.';

// Los `errors` del back llegan en inglés (PB-15): se mapea por clave y nunca se muestra su texto.
const MENSAJE_POR_CLAVE: Record<CampoEdicion, string> = {
  nombre: MENSAJES_USUARIO.nombreObligatorio,
  apellido: MENSAJES_USUARIO.apellidoObligatorio,
  rol: MENSAJES_USUARIO.rolInvalido,
};

function camposDelError(errors: Record<string, string[]>): CampoEdicion[] {
  const conocidos = Object.keys(MENSAJE_POR_CLAVE) as CampoEdicion[];
  return Object.keys(errors).flatMap((clave) => {
    const campo = conocidos.find((conocido) => conocido === clave.toLowerCase());
    return campo ? [campo] : [];
  });
}

/**
 * Panel de edición (D-B25-04): reemplaza al de alta mientras se edita. Solo `nombre`, `apellido` y `rol`;
 * el email se ve deshabilitado y no hay contraseña. El que lo monta pasa `key={usuario.id}`.
 */
export function EditarUsuarioPanel({
  usuario,
  esUltimoAdministrador,
  onCerrar,
}: EditarUsuarioPanelProps) {
  const editar = useEditarUsuario();
  const enviando = useRef(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setFocus,
    formState: { errors },
  } = useForm<EditarUsuarioPayload>({
    resolver: zodResolver(editarUsuarioSchema) as Resolver<EditarUsuarioPayload>,
    defaultValues: { nombre: usuario.nombre, apellido: usuario.apellido, rol: usuario.rol },
  });

  function cancelar() {
    reset();
    onCerrar();
  }

  function alFallar(error: unknown) {
    if (!isApiError(error) || error.kind !== 'http') {
      toast.error(MENSAJE_INESPERADO);
      return;
    }
    if (error.status === 401) return; // La sesión vencida la resuelve el cliente (T-08).
    if (error.status === 403) {
      toast.error(MENSAJE_SIN_PERMISO);
      return;
    }
    if (error.status === 400 && error.errors) {
      const campos = camposDelError(error.errors);
      if (campos.length > 0) {
        campos.forEach((campo) =>
          setError(campo, { type: 'server', message: MENSAJE_POR_CLAVE[campo] }),
        );
        setFocus(campos[0] as CampoEdicion);
        return;
      }
    }
    toast.error(error.detail ?? MENSAJE_INESPERADO);
  }

  function enviar(valores: EditarUsuarioPayload) {
    if (enviando.current) return;
    if (esUltimoAdministrador && valores.rol !== 'Administrador') {
      setError('rol', { type: 'regla', message: MOTIVO_ULTIMO_ADMINISTRADOR });
      return;
    }
    enviando.current = true;
    editar.mutate(
      { id: usuario.id, body: valores },
      {
        onSuccess: () => {
          toast.success(MENSAJE_EXITO);
          onCerrar();
        },
        onError: alFallar,
        onSettled: () => {
          enviando.current = false;
        },
      },
    );
  }

  return (
    <form
      noValidate
      aria-labelledby="titulo-editar-usuario"
      onSubmit={(evento) => void handleSubmit(enviar)(evento)}
      className="flex w-[360px] shrink-0 flex-col gap-sp-16 border-l border-border-strong p-sp-24"
    >
      <h3 id="titulo-editar-usuario" className="text-body font-semibold text-text-primary">
        Editar usuario
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
      <Input label="Email" type="email" value={usuario.email} disabled readOnly />
      <RolSelector
        {...register('rol')}
        {...(errors.rol?.message ? { mensajeError: errors.rol.message } : {})}
      />
      <div className="mt-auto flex justify-end gap-sp-8 border-t border-border-strong pt-sp-16">
        <Button label="Cancelar" variant="secondary" size="m" onClick={cancelar} />
        <Button
          type="submit"
          label={editar.isPending ? 'Guardando…' : 'Guardar cambios'}
          variant="primary"
          size="m"
          disabled={editar.isPending}
          aria-busy={editar.isPending}
        />
      </div>
    </form>
  );
}
