import { TabPanel, Tabs } from '@nexa/ui';
import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';

const ITEMS = [
  { id: 'datos', label: 'Datos' },
  { id: 'vehiculos', label: 'Vehículos' },
] as const;

type PestanaId = (typeof ITEMS)[number]['id'];

/** Cualquier valor que no sea una pestaña conocida cae en Vehículos (D-17, B-07 §9). */
function leerPestana(valor: string | null): PestanaId {
  return valor === 'datos' ? 'datos' : 'vehiculos';
}

interface ClienteTabsProps {
  vehiculos: ReactNode;
  datos: ReactNode;
}

/** La pestaña vive en `?tab=` para que recargar o compartir el enlace no cambie la vista. */
export function ClienteTabs({ vehiculos, datos }: ClienteTabsProps) {
  const [parametros, setParametros] = useSearchParams();
  const activa = leerPestana(parametros.get('tab'));

  const cambiar = (id: string) => {
    const siguiente = new URLSearchParams(parametros);
    if (id === 'datos') siguiente.set('tab', 'datos');
    else siguiente.delete('tab');
    setParametros(siguiente, { replace: true });
  };

  return (
    <Tabs label="Secciones del cliente" items={ITEMS} value={activa} onValueChange={cambiar}>
      <TabPanel tabId="vehiculos">{vehiculos}</TabPanel>
      <TabPanel tabId="datos">{datos}</TabPanel>
    </Tabs>
  );
}
