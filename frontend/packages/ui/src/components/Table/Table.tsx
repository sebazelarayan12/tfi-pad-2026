import { DotsThreeIcon } from '@phosphor-icons/react/dist/csr/DotsThree';
import type { ReactNode } from 'react';

export interface TableColumn<T> {
  key: keyof T & string;
  header: string;
  /** Ancho en px. Sin `width`, las columnas se reparten por igual (D-T06-1). */
  width?: number;
  /** Sobrescribe el valor de la celda. Los `null` los resuelve la pantalla. */
  render?: (row: T) => ReactNode;
  /** DNI y números de póliza: fuente monoespaciada. */
  mono?: boolean;
}

export interface TableProps<T> {
  /** Nombre accesible de la tabla; se oculta visualmente (`sr-only`). */
  caption: string;
  columns: ReadonlyArray<TableColumn<T>>;
  rows: ReadonlyArray<T>;
  /** Clave estable de la fila: usar el id de la entidad, no el índice. */
  getRowKey: (row: T) => string;
  onRowMenu?: (row: T) => void;
}

function radioSuperior(indice: number, total: number, conMenu: boolean): string {
  if (conMenu) return indice === 0 ? 'rounded-tl-input' : '';
  if (indice === 0 && total === 1) return 'rounded-tl-input rounded-tr-input';
  if (indice === 0) return 'rounded-tl-input';
  if (indice === total - 1) return 'rounded-tr-input';
  return '';
}

/**
 * Tabla accesible: `<caption>` obligatorio y `<th scope="col">` (`design-system §5.12`).
 * No tiene estado de carga ni de vacío: los pone la pantalla.
 */
export function Table<T>({ caption, columns, rows, getRowKey, onRowMenu }: TableProps<T>) {
  const conMenu = onRowMenu !== undefined;

  return (
    <table className="w-full table-fixed border-separate border-spacing-0">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr className="bg-surface-subtle">
          {columns.map((columna, indice) => (
            <th
              key={columna.key}
              scope="col"
              className={`h-10 px-sp-16 text-left text-label text-text-secondary ${radioSuperior(indice, columns.length, conMenu)}`.trimEnd()}
              style={columna.width === undefined ? undefined : { width: `${columna.width}px` }}
            >
              {columna.header}
            </th>
          ))}
          {conMenu ? (
            <th scope="col" className="h-10 w-6 rounded-tr-input">
              <span className="sr-only">Acciones</span>
            </th>
          ) : null}
        </tr>
      </thead>
      <tbody>
        {rows.map((fila) => (
          <tr key={getRowKey(fila)} className="h-12">
            {columns.map((columna) => (
              <td
                key={columna.key}
                className={`border-b border-border-hairline px-sp-16 align-middle ${
                  columna.mono ? 'font-mono text-mono' : 'text-body-sm'
                } text-text-primary`}
              >
                {columna.render ? columna.render(fila) : String(fila[columna.key])}
              </td>
            ))}
            {conMenu ? (
              <td className="w-6 border-b border-border-hairline align-middle">
                <button
                  type="button"
                  aria-label="Acciones de la fila"
                  onClick={() => onRowMenu(fila)}
                  className="inline-flex focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
                >
                  <span aria-hidden="true" className="inline-flex">
                    <DotsThreeIcon size={16} weight="regular" />
                  </span>
                </button>
              </td>
            ) : null}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
