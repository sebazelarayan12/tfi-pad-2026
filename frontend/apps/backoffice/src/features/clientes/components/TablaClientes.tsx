import { formatearDni, type ClienteResumenResponse } from '@nexa/api';
import { Button, EstadoBadge, Table, type TableColumn } from '@nexa/ui';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { TAMANO_PAGINA } from '../api/useClientes';

/** Modelo de presentación: no amplía el DTO ni calcula los datos faltantes de PB-03. */
interface FilaTabla {
  id: string;
  nombre: ReactNode;
  dni: ReactNode;
  email: ReactNode;
  telefono: ReactNode;
  vehiculos: ReactNode;
  renaper: ReactNode;
  polizas: ReactNode;
}
const columnas: TableColumn<FilaTabla>[] = [
  { key: 'nombre', header: 'Nombre', width: 210, render: (fila) => fila.nombre },
  { key: 'dni', header: 'DNI', width: 116, mono: true, render: (fila) => fila.dni },
  { key: 'email', header: 'Email', width: 226, render: (fila) => fila.email },
  { key: 'telefono', header: 'Teléfono', width: 124, render: (fila) => fila.telefono },
  { key: 'vehiculos', header: 'Vehículos', width: 104, render: (fila) => fila.vehiculos },
  { key: 'renaper', header: 'Renaper', width: 130, render: (fila) => fila.renaper },
  { key: 'polizas', header: 'Pólizas activas', width: 146, render: (fila) => fila.polizas },
];
const esqueleto = (
  <span
    aria-hidden="true"
    className="block h-3 rounded-input bg-surface-subtle motion-safe:animate-pulse"
  />
);
const carga: FilaTabla[] = Array.from({ length: TAMANO_PAGINA }, (_, i) => ({
  id: `carga-${i}`,
  nombre: esqueleto,
  dni: esqueleto,
  email: esqueleto,
  telefono: esqueleto,
  vehiculos: esqueleto,
  renaper: esqueleto,
  polizas: esqueleto,
}));

interface Props {
  clientes: ClienteResumenResponse[];
  cargando: boolean;
  buscando: boolean;
  onLimpiar: () => void;
}
export function TablaClientes({ clientes, cargando, buscando, onLimpiar }: Props) {
  const filas: FilaTabla[] = cargando
    ? carga
    : clientes.map((cliente) => ({
        id: cliente.id,
        nombre: (
          <Link
            className="break-words font-semibold hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
            to={`/clientes/${encodeURIComponent(cliente.id)}`}
          >
            {cliente.nombre} {cliente.apellido}
          </Link>
        ),
        dni: formatearDni(cliente.dni),
        email: <span className="break-all">{cliente.email}</span>,
        telefono: <span className="break-words">{cliente.telefono || '—'}</span>,
        vehiculos: cliente.cantidadVehiculos,
        renaper: <EstadoBadge estado={cliente.validadoRenaper ? 'Validado' : 'Pendiente'} />,
        polizas: cliente.cantidadPolizasActivas,
      }));
  return (
    <div
      aria-busy={cargando}
      className="overflow-x-auto rounded-input border border-border-hairline bg-surface-panel"
    >
      <Table caption="Clientes" columns={columnas} rows={filas} getRowKey={(fila) => fila.id} />
      {!cargando && clientes.length === 0 ? (
        <div className="flex flex-col items-center gap-sp-12 px-sp-16 py-sp-24 text-center text-body-sm text-text-secondary">
          <p>
            {buscando
              ? 'No hay clientes que coincidan con la búsqueda.'
              : 'Todavía no hay clientes cargados.'}
          </p>
          {buscando ? (
            <Button label="Limpiar filtros" variant="secondary" size="s" onClick={onLimpiar} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
