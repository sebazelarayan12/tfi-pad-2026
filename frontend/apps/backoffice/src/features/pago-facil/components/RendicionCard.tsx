import { CardWidget } from '@nexa/ui';
import { useId, useRef, useState } from 'react';
import { useSubirRendicion } from '../api/useSubirRendicion';
import { validarArchivoRendicion } from '../schemas/archivoRendicion';
import { resultadoErrorRendicion } from '../schemas/parseErroresRendicion';
import type { ResultadoSubida } from '../types/rendicion';
import { RendicionAviso } from './RendicionAviso';
import { RendicionDropzone } from './RendicionDropzone';
import { RendicionResultado } from './RendicionResultado';

export function RendicionCard() {
  const [resultado, setResultado] = useState<ResultadoSubida>({ tipo: 'ninguno' });
  const { mutateAsync, isPending } = useSubirRendicion();
  const enCurso = useRef(false);
  const avisoId = useId();

  async function subir(archivo: File) {
    if (enCurso.current) return;
    const mensaje = validarArchivoRendicion(archivo);
    if (mensaje) {
      setResultado({ tipo: 'error', mensaje });
      return;
    }
    enCurso.current = true;
    setResultado({ tipo: 'ninguno' });
    try {
      const respuesta = await mutateAsync(archivo);
      setResultado({ tipo: 'ok', resultado: respuesta });
    } catch (error) {
      setResultado(resultadoErrorRendicion(error));
    } finally {
      enCurso.current = false;
    }
  }

  return (
    <CardWidget title="Rendición diaria">
      <div className="flex flex-col gap-sp-16">
        <p>Subí el archivo de rendición del día. Cada archivo se procesa una sola vez.</p>
        <RendicionDropzone
          subiendo={isPending}
          avisoId={resultado.tipo === 'error' ? avisoId : undefined}
          onArchivo={subir}
        />
        {resultado.tipo === 'error' ? <RendicionAviso id={avisoId} aviso={resultado} /> : null}
        {resultado.tipo === 'ok' ? <RendicionResultado resultado={resultado.resultado} /> : null}
      </div>
    </CardWidget>
  );
}
