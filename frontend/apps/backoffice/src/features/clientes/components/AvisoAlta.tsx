import { toast } from '@nexa/ui';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ID_AVISO = 'aviso-alta-cliente';

function leerAviso(state: unknown) {
  if (typeof state !== 'object' || state === null || !('aviso' in state)) return null;
  const aviso: unknown = state.aviso;
  if (
    typeof aviso !== 'object' ||
    aviso === null ||
    !('tipo' in aviso) ||
    !('texto' in aviso) ||
    typeof aviso.texto !== 'string'
  )
    return null;
  if (aviso.tipo !== 'exito' && aviso.tipo !== 'advertencia') return null;
  return { tipo: aviso.tipo, texto: aviso.texto };
}

/**
 * Muestra con toast (FC19) el aviso que llega por `location.state.aviso` y lo consume del
 * historial: paginar, salir de la pantalla y volver Atrás no lo repiten.
 */
export function AvisoAlta() {
  const ubicacion = useLocation();
  const navegar = useNavigate();
  useEffect(() => {
    const aviso = leerAviso(ubicacion.state);
    if (!aviso) return;
    // El id evita el toast doble del doble efecto de StrictMode.
    if (aviso.tipo === 'exito') toast.success(aviso.texto, { id: ID_AVISO });
    else toast.warning(aviso.texto, { id: ID_AVISO });
    const estado: Record<string, unknown> = { ...ubicacion.state };
    delete estado.aviso;
    void navegar(
      { pathname: ubicacion.pathname, search: ubicacion.search, hash: ubicacion.hash },
      { replace: true, state: estado, preventScrollReset: true },
    );
  }, [ubicacion, navegar]);
  return null;
}
