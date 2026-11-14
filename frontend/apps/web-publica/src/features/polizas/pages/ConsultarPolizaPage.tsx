import { zodResolver } from '@hookform/resolvers/zod';
import { isApiError } from '@nexa/api';
import { useState } from 'react';
import { useForm, type FieldErrors } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { ANCHO_COMPLETO, CONTENEDOR } from '../../../marca/estilos';
import { Aparecer } from '../../../shared/animacion/Aparecer';
import { useConsultarPoliza } from '../api/useConsultarPoliza';
import {
  AlertaEstadoConsulta,
  type TonoAlertaEstadoConsulta,
} from '../components/AlertaEstadoConsulta';
import { FormularioConsultaPoliza } from '../components/FormularioConsultaPoliza';
import { consultaSchema, type ConsultaFormValues } from '../schemas/consulta';
import type { EstadoMiPoliza } from '../types/navegacion';

// Textos de W2 §8. El 404 y el 429 son literales del Figma; el genérico es una propuesta.
const ALERTA_NO_ENCONTRADA =
  'No encontramos una póliza con esos datos. Revisá el DNI y el número de póliza.';
const ALERTA_DEMASIADOS_INTENTOS = 'Hiciste muchos intentos. Esperá un minuto y volvé a probar.';
const ALERTA_GENERICA = 'No pudimos consultar tu póliza. Intentá de nuevo en unos minutos.';

const CAMPOS = ['dni', 'numeroPoliza'] as const;
const ALT_IMAGEN = 'Auto negro delante del escudo de Nexa Seguros';
// Misma imagen en dos versiones: wordmark azul para el modo claro y blanco para el oscuro.
const IMAGEN_CLARA = '/img/auto-escudo-claro.webp';
const IMAGEN_OSCURA = '/img/auto-escudo-oscuro.webp';
const ANCHO_IMAGEN = 1200;
const ALTO_IMAGEN = 759;

interface AlertaVisible {
  tono: TonoAlertaEstadoConsulta;
  texto: string;
}

interface ErrorDeCampo {
  campo: (typeof CAMPOS)[number];
  mensaje: string;
}

/** El back devuelve `errors` con la propiedad C# en PascalCase (convenciones §3.3). */
function erroresDeCampo(error: unknown): ErrorDeCampo[] {
  if (!isApiError(error) || error.status !== 400 || error.errors === null) return [];

  const resultado: ErrorDeCampo[] = [];
  const dni = error.errors.Dni?.[0] ?? error.errors.dni?.[0];
  if (dni) resultado.push({ campo: 'dni', mensaje: dni });

  const numeroPoliza = error.errors.NumeroPoliza?.[0] ?? error.errors.numeroPoliza?.[0];
  if (numeroPoliza) resultado.push({ campo: 'numeroPoliza', mensaje: numeroPoliza });

  return resultado;
}

/** Sólo los estados que define la ficha; el `detail` del back nunca se muestra (DN-W3-1). */
function alertaDeError(error: unknown): AlertaVisible {
  if (isApiError(error)) {
    if (error.status === 404) return { tono: 'error', texto: ALERTA_NO_ENCONTRADA };
    if (error.status === 429) return { tono: 'aviso', texto: ALERTA_DEMASIADOS_INTENTOS };
  }
  return { tono: 'error', texto: ALERTA_GENERICA };
}

/** Pantalla W2 `/consultar-poliza` de la web pública. */
export function ConsultarPolizaPage() {
  const navigate = useNavigate();
  const { mutateAsync, isPending } = useConsultarPoliza();
  const [alerta, setAlerta] = useState<AlertaVisible | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    clearErrors,
    formState: { errors },
  } = useForm<ConsultaFormValues>({
    resolver: zodResolver(consultaSchema),
    defaultValues: { dni: '', numeroPoliza: '' },
  });

  const enviar = async (valores: ConsultaFormValues) => {
    setAlerta(null);
    clearErrors();
    try {
      const consulta = await mutateAsync(valores);
      const estado: EstadoMiPoliza = {
        dni: valores.dni,
        numeroPoliza: valores.numeroPoliza,
        consulta,
      };
      navigate('/poliza', { state: estado });
    } catch (error) {
      const campos = erroresDeCampo(error);
      if (campos.length > 0) {
        for (const { campo, mensaje } of campos) {
          setError(campo, { type: 'server', message: mensaje });
        }
        setFocus(campos[0].campo);
        return;
      }
      setAlerta(alertaDeError(error));
    }
  };

  const invalido = (errores: FieldErrors<ConsultaFormValues>) => {
    setAlerta(null);
    const primero = CAMPOS.find((campo) => errores[campo] !== undefined);
    if (primero) setFocus(primero);
  };

  return (
    // Fondo niebla que se funde hacia el pie; en desktop, el auto con el escudo a la izquierda y el formulario a la derecha.
    <div
      className={`${ANCHO_COMPLETO} flex flex-1 bg-tema-fondo md:bg-gradient-to-b md:from-tema-fondo-alt md:to-tema-fondo`}
    >
      <div
        className={`${CONTENEDOR} grid flex-1 items-stretch gap-sp-24 py-sp-32 md:py-sp-64 lg:grid-cols-2 lg:gap-sp-40`}
      >
        <Aparecer className="hidden lg:block">
          {/* `lazy` hace que el navegador solo descargue la versión visible del modo activo. */}
          <div className="flex h-full min-h-[560px] items-center">
            <img
              src={IMAGEN_CLARA}
              alt={ALT_IMAGEN}
              loading="lazy"
              width={ANCHO_IMAGEN}
              height={ALTO_IMAGEN}
              className="h-auto w-full dark:hidden"
            />
            <img
              src={IMAGEN_OSCURA}
              alt={ALT_IMAGEN}
              loading="lazy"
              width={ANCHO_IMAGEN}
              height={ALTO_IMAGEN}
              className="hidden h-auto w-full dark:block"
            />
          </div>
        </Aparecer>
        <Aparecer retardoMs={150} className="flex flex-col justify-center gap-sp-24">
          <FormularioConsultaPoliza
            register={register}
            errors={errors}
            enviando={isPending}
            onSubmit={(evento) => void handleSubmit(enviar, invalido)(evento)}
          />
          {alerta ? (
            <div className="w-full md:max-w-[560px] lg:max-w-none">
              <AlertaEstadoConsulta tono={alerta.tono}>{alerta.texto}</AlertaEstadoConsulta>
            </div>
          ) : null}
        </Aparecer>
      </div>
    </div>
  );
}
