import { zodResolver } from '@hookform/resolvers/zod';
import { isApiError, quitarFormatoDni, type ClienteResponse } from '@nexa/api';
import { Button, toast } from '@nexa/ui';
import { useEffect, useRef, useState } from 'react';
import { useForm, useWatch, type Resolver } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { mapearErroresAlta } from '../api/mapearErroresAlta';
import { useAltaCliente } from '../api/useAltaCliente';
import { usePrevisualizarRenaper } from '../api/usePrevisualizarRenaper';
import {
  altaClienteSchema,
  type AltaClienteFormValues,
  type AltaClienteValidado,
} from '../schemas/altaClienteSchema';
import {
  CAMPOS_RENAPER,
  datosRenaperAFormulario,
  type CampoRenaper,
  type DatosRenaperFormulario,
} from '../schemas/datosRenaperAFormulario';
import { normalizarAltaCliente } from '../schemas/normalizarAltaCliente';
import { AccionRenaper } from './AccionRenaper';
import { ConfirmarDescarte } from './ConfirmarDescarte';
import { SeccionContacto } from './SeccionContacto';
import { SeccionDatosPersonales } from './SeccionDatosPersonales';
import { SeccionDomicilio } from './SeccionDomicilio';
import { mensajeDniRenaper, resultadoRenaper, TEXTOS_RENAPER } from './textosRenaper';
import { VALORES_VACIOS_ALTA } from './tiposFormulario';
import { WidgetValidacionRenaper } from './WidgetValidacionRenaper';

const RUTA_LISTADO = '/clientes';
const AVISO_GUARDADO = 'Cliente guardado.';
const AVISO_SIN_RENAPER = 'Cliente guardado sin validar en Renaper.';
const ID_AVISO_FALLECIDO = 'alta-aviso-fallecido';
const DNI_COMPLETO = /^\d{8}$/;

interface PrecargaRenaper {
  dni: string;
  datos: DatosRenaperFormulario;
}

/**
 * Formulario de alta (B4) con su rail de validación de Renaper (B-06). Un solo POST por envío
 * (FC11); 201 vuelve al listado con el aviso que muestra B-04 (RV-41). La consulta a Renaper
 * (GET) solo precarga y marca campos: no guarda nada.
 */
export function FormularioAltaCliente() {
  const navegar = useNavigate();
  const alta = useAltaCliente();
  const enviando = useRef(false);
  const contenedorBoton = useRef<HTMLDivElement>(null);
  const volverFocoAlBoton = useRef(false);
  const [confirmandoDescarte, setConfirmandoDescarte] = useState(false);
  const [precarga, setPrecarga] = useState<PrecargaRenaper | null>(null);

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
    setValue,
    control,
    formState: { isDirty },
  } = form;

  const valores = useWatch({ control });
  const dni = quitarFormatoDni(valores.dni ?? '');
  const renaper = usePrevisualizarRenaper(dni);
  const consultando = renaper.isFetching;
  // Al cambiar el DNI la clave de la consulta cambia y el resultado anterior se descarta.
  const resultado = resultadoRenaper(renaper.data, renaper.error);
  const fallecido = resultado.tipo === 'fallecido';

  // El botón se deshabilita durante la consulta y pierde el foco: se lo devuelve al terminar.
  useEffect(() => {
    if (consultando || !volverFocoAlBoton.current) return;
    volverFocoAlBoton.current = false;
    contenedorBoton.current?.querySelector('button')?.focus();
  }, [consultando, precarga]);

  const validarEnRenaper = async () => {
    const { data } = await renaper.refetch();
    if (!data) {
      setFocus('dni');
      return;
    }
    const datos = datosRenaperAFormulario(data);
    CAMPOS_RENAPER.forEach((campo) => {
      const valor = datos[campo];
      if (valor !== undefined) setValue(campo, valor, { shouldDirty: true, shouldValidate: true });
    });
    setPrecarga({ dni, datos });
    volverFocoAlBoton.current = true;
  };

  // Un campo conserva la marca mientras su valor sea el de Renaper para el DNI consultado.
  const esDatoRenaper = (campo: CampoRenaper) =>
    precarga?.dni === dni &&
    precarga.datos[campo] !== undefined &&
    precarga.datos[campo] !== '' &&
    valores[campo] === precarga.datos[campo];

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

  const enviar = (datos: AltaClienteValidado) => {
    if (enviando.current || fallecido) return;
    enviando.current = true;
    alta.mutate(normalizarAltaCliente(datos), {
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
    <div className="flex flex-col gap-sp-24 xl:flex-row">
      <form
        noValidate
        aria-label="Nuevo cliente"
        aria-busy={bloqueado}
        onSubmit={(evento) => void handleSubmit(enviar)(evento)}
        className="flex min-w-0 flex-1 flex-col gap-sp-24"
      >
        <SeccionDatosPersonales
          form={form}
          deshabilitado={bloqueado}
          esDatoRenaper={esDatoRenaper}
          errorDniRenaper={mensajeDniRenaper(resultado)}
          accionRenaper={
            <AccionRenaper
              contenedor={contenedorBoton}
              habilitado={DNI_COMPLETO.test(dni)}
              consultando={consultando}
              onValidar={() => void validarEnRenaper()}
            />
          }
        />
        <div className="border-t border-border-hairline pt-sp-24">
          <SeccionContacto form={form} deshabilitado={bloqueado} />
        </div>
        <div className="border-t border-border-hairline pt-sp-24">
          <SeccionDomicilio form={form} deshabilitado={bloqueado} esDatoRenaper={esDatoRenaper} />
        </div>
        {fallecido ? (
          <p id={ID_AVISO_FALLECIDO} className="text-body-sm text-status-cancelada-text">
            {TEXTOS_RENAPER.fallecido}
          </p>
        ) : null}
        <div className="flex justify-end gap-sp-12">
          <Button label="Cancelar" variant="secondary" disabled={bloqueado} onClick={cancelar} />
          <Button
            label="Guardar cliente"
            type="submit"
            disabled={bloqueado || fallecido}
            aria-busy={bloqueado}
            aria-describedby={fallecido ? ID_AVISO_FALLECIDO : undefined}
          />
        </div>
        {confirmandoDescarte ? (
          <ConfirmarDescarte
            onSeguirEditando={() => setConfirmandoDescarte(false)}
            onDescartar={() => void navegar(RUTA_LISTADO)}
          />
        ) : null}
      </form>
      <aside
        aria-label="Validación de Renaper"
        className="w-full xl:w-[320px] xl:shrink-0 xl:border-l xl:border-border-hairline xl:pl-sp-24"
      >
        <WidgetValidacionRenaper resultado={resultado} />
      </aside>
    </div>
  );
}
