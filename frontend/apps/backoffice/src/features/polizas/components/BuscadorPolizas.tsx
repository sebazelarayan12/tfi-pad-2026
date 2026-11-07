import { Input } from '@nexa/ui';
import { useEffect, useRef, useState, type FormEvent } from 'react';

import {
  AYUDA_BUSCADOR,
  ERROR_FORMATO_BUSCADOR,
  ETIQUETA_BUSCADOR,
  PLACEHOLDER_BUSCADOR,
} from '../textos';

/** DP-B14-03: la búsqueda se dispara 300 ms después de la última tecla o con Enter. */
export const RETARDO_BUSQUEDA_MS = 300;

interface BuscadorPolizasProps {
  formatoInvalido: boolean;
  onBuscar: (texto: string) => void;
}

/** El texto vive en el estado del componente, no en la URL, para no exponer el DNI (DP-B14-04). */
export function BuscadorPolizas({ formatoInvalido, onBuscar }: BuscadorPolizasProps) {
  const [texto, setTexto] = useState('');
  const temporizador = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(temporizador.current), []);

  function buscarAhora(valor: string) {
    clearTimeout(temporizador.current);
    onBuscar(valor);
  }

  function alEscribir(valor: string) {
    setTexto(valor);
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => onBuscar(valor), RETARDO_BUSQUEDA_MS);
  }

  function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    buscarAhora(texto);
  }

  return (
    <form role="search" onSubmit={alEnviar} className="max-w-md">
      <Input
        label={ETIQUETA_BUSCADOR}
        placeholder={PLACEHOLDER_BUSCADOR}
        helper={formatoInvalido ? ERROR_FORMATO_BUSCADOR : AYUDA_BUSCADOR}
        error={formatoInvalido}
        value={texto}
        onChange={(evento) => alEscribir(evento.target.value)}
        autoComplete="off"
        maxLength={20}
      />
    </form>
  );
}
