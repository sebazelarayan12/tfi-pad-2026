import { useEffect, useState } from 'react';
import { busquedaClientes } from '../schemas/busquedaClientes';

/** La URL y el input se actualizan de inmediato; solo la consulta espera 300 ms de inactividad. */
export function useBusquedaClientes(texto: string) {
  const [estable, setEstable] = useState(texto);
  useEffect(() => {
    if (estable === texto) return;
    const timer = setTimeout(() => setEstable(texto), 300);
    return () => clearTimeout(timer);
  }, [texto, estable]);
  return { filtro: busquedaClientes.parse(estable), pendiente: estable !== texto };
}
