import { zodResolver } from '@hookform/resolvers/zod';
import { isApiError, type ClienteResponse } from '@nexa/api';
import { Button, toast } from '@nexa/ui';
import { useRef, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { mapearErroresAlta } from '../api/mapearErroresAlta';
import { useAltaCliente } from '../api/useAltaCliente';
import {
  altaClienteSchema,
  type AltaClienteFormValues,
  type AltaClienteValidado,
} from '../schemas/altaClienteSchema';
import { normalizarAltaCliente } from '../schemas/normalizarAltaCliente';
import { ConfirmarDescarte } from './ConfirmarDescarte';
import { SeccionContacto } from './SeccionContacto';
import { SeccionDatosPersonales } from './SeccionDatosPersonales';
import { SeccionDomicilio } from './SeccionDomicilio';
import { VALORES_VACIOS_ALTA } from './tiposFormulario';

const RUTA_LISTADO = '/clientes';
const AVISO_GUARDADO = 'Cliente guardado.';
const AVISO_SIN_RENAPER = 'Cliente guardado sin validar en Renaper.';

/**
 * Formulario de alta (B4). Un solo POST por envío (FC11); 201 vuelve al listado con el aviso
 * que muestra B-04 (RV-41). No consulta a Renaper: eso es B-06.
 */
export function FormularioAltaCliente() {
  const navegar = useNavigate();
  const alta = useAltaCliente();
  const enviando = useRef(false);
  const [confirmandoDescarte, setConfirmandoDescarte] = useState(false);

  const form = useForm<AltaClienteFormValues, unknown, AltaClienteValidado>({
    // El esquema acepta solo valores ya elegidos; el formulario arranca con selects vacíos.
    resolver: zodResolver(altaClienteSchema) as Resolver<
      AltaClienteFormValues,
      unknown,
      AltaClienteValidado
    >,
    defaultValues: VALORES_VACIOS_ALTA,
  });
  // `isDirty` se lee en el render: React Hook Form solo se suscribe a lo que se lee ahí.
  const {
    handleSubmit,
    setError,
    setFocus,
    formState: { isDirty },
  } = form;

  const alExito = (cliente: ClienteResponse) => {
    const aviso = cliente.validadoRenaper
      ? { tipo: 'exito', texto: AVISO_GUARDADO }
      : { tipo: 'advertencia', texto: AVISO_SIN_RENAPER };
    void navegar(RUTA_LISTADO, { replace: true, state: { aviso } });
  };

  const alFallar = (error: unknown) => {
    // La sesión vencida la resuelve el cliente de la API (T-08).
    if (isApiError(error) && error.kind === 'http' && error.status === 401) return;
    const { campos, general } = mapearErroresAlta(error);
    const marcados = Object.entries(campos) as [keyof AltaClienteFormValues, string][];
    marcados.forEach(([campo, message]) => setError(campo, { type: 'server', message }));
    if (marcados[0]) setFocus(marcados[0][0]);
    if (general) toast.error(general);
  };

  const enviar = (valores: AltaClienteValidado) => {
    if (enviando.current) return;
    enviando.current = true;
    alta.mutate(normalizarAltaCliente(valores), {
      onSuccess: alExito,
      onError: alFallar,
      onSettled: () => {
        enviando.current = false;
      },
    });
  };

  const cancelar = () => {
    if (isDirty) setConfirmandoDescarte(true);
    else void navegar(RUTA_LISTADO);
  };

  const bloqueado = alta.isPending;

  return (
    <form
      noValidate
      aria-label="Nuevo cliente"
      aria-busy={bloqueado}
      onSubmit={(evento) => void handleSubmit(enviar)(evento)}
      className="flex max-w-[720px] flex-col gap-sp-32"
    >
      <SeccionDatosPersonales form={form} deshabilitado={bloqueado} />
      <SeccionContacto form={form} deshabilitado={bloqueado} />
      <SeccionDomicilio form={form} deshabilitado={bloqueado} />
      <div className="flex justify-end gap-sp-12">
        <Button label="Cancelar" variant="secondary" disabled={bloqueado} onClick={cancelar} />
        <Button label="Guardar cliente" type="submit" disabled={bloqueado} aria-busy={bloqueado} />
      </div>
      {confirmandoDescarte ? (
        <ConfirmarDescarte
          onSeguirEditando={() => setConfirmandoDescarte(false)}
          onDescartar={() => void navegar(RUTA_LISTADO)}
        />
      ) : null}
    </form>
  );
}
