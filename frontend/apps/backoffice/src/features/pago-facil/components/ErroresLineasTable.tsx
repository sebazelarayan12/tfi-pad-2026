import type { ErrorLineaRendicion } from '@nexa/api';

export function ErroresLineasTable({ errores }: { errores: ErrorLineaRendicion[] }) {
  return (
    <div className="overflow-hidden rounded-input border border-border-hairline">
      <table className="w-full table-fixed text-left">
        <caption className="sr-only">Líneas rechazadas</caption>
        <thead className="bg-surface-subtle text-text-primary">
          <tr className="h-10">
            <th scope="col" className="w-20 px-sp-12">
              Línea
            </th>
            <th scope="col" className="px-sp-12">
              Motivo
            </th>
          </tr>
        </thead>
        <tbody>
          {errores.map(({ linea, motivo }) => (
            <tr key={linea} className="h-12 border-t border-border-hairline">
              <td className="px-sp-12 py-sp-8 tabular-nums">{linea}</td>
              <td className="break-words px-sp-12 py-sp-8">{motivo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
