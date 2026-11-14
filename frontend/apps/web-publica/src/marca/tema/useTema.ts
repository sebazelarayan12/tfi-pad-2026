import { useSyncExternalStore } from 'react';

import { cambiarTema, leerTema, suscribirTema, type Tema } from './temaActual';

/** Tema activo y la acción para alternarlo. */
export function useTema(): { tema: Tema; alternar: () => void } {
  const tema = useSyncExternalStore(suscribirTema, leerTema, () => 'claro' as const);
  return { tema, alternar: () => cambiarTema(tema === 'oscuro' ? 'claro' : 'oscuro') };
}
