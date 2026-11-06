import { descargarBasePositiva, useApiClient } from '@nexa/api';
import { useRef, useState } from 'react';
import { descargarTextoComoArchivo } from './descargarTextoComoArchivo';

export function useDescargarBasePositiva() {
  const cliente = useApiClient();
  const enCurso = useRef(false);
  const [estado, setEstado] = useState<
    { isPending: true; error: null } | { isPending: false; error: unknown }
  >({ isPending: false, error: null });

  async function generar() {
    if (enCurso.current) return;
    enCurso.current = true;
    setEstado({ isPending: true, error: null });
    try {
      const { nombreArchivo, contenido } = await descargarBasePositiva(cliente);
      descargarTextoComoArchivo(nombreArchivo, contenido);
      setEstado({ isPending: false, error: null });
    } catch (error) {
      setEstado({ isPending: false, error });
    } finally {
      enCurso.current = false;
    }
  }

  return { generar, isPending: estado.isPending, error: estado.error };
}
