import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

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

/** Se captura al entrar: un cambio de ubicación descarta el aviso y evita repetirlo al paginar. */
export function AvisoAlta() {
  const ubicacion = useLocation();
  const navegar = useNavigate();
  const ruta = `${ubicacion.pathname}${ubicacion.search}${ubicacion.hash}`;
  const [entrada, setEntrada] = useState(() => ({
    ruta,
    aviso: leerAviso(ubicacion.state),
  }));
  useEffect(() => {
    if (!leerAviso(ubicacion.state)) return;
    const estado: Record<string, unknown> = { ...ubicacion.state };
    delete estado.aviso;
    // Se consume el aviso del historial: salir de la pantalla y volver tampoco lo repite.
    void navegar(
      { pathname: ubicacion.pathname, search: ubicacion.search, hash: ubicacion.hash },
      { replace: true, state: estado, preventScrollReset: true },
    );
  }, [ubicacion, navegar]);
  // Al cambiar la entrada se descarta el aviso; volver Atrás no lo resucita.
  if (entrada.ruta !== ruta) {
    setEntrada({ ruta, aviso: null });
    return null;
  }
  if (!entrada.aviso) return null;
  const clases =
    entrada.aviso.tipo === 'exito'
      ? 'bg-status-vigente-bg text-status-vigente-text'
      : 'bg-status-pendiente-bg text-status-pendiente-text';
  return (
    <div role="alert" className={`rounded-card px-sp-16 py-sp-12 text-body-sm ${clases}`}>
      {entrada.aviso.texto}
    </div>
  );
}
