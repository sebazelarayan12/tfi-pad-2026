import { formatearImporte, type RendicionResponse } from '@nexa/api';
import { Button } from '@nexa/ui';
import { useState } from 'react';
import { ErroresLineasTable } from './ErroresLineasTable';

export function RendicionResultado({ resultado }: { resultado: RendicionResponse }) {
  const [estadoCopia, setEstadoCopia] = useState('');
  const resumen = [
    `Líneas procesadas: ${resultado.procesadas} de ${resultado.cantidadRegistros}.`,
    `Líneas rechazadas: ${resultado.rechazadas}.`,
    `Importe total: ${formatearImporte(resultado.importeTotal)}.`,
  ];

  function textoResultado() {
    return [
      resultado.nombreArchivo,
      ...resumen,
      ...resultado.errores.map(({ linea, motivo }) => `Línea ${linea}: ${motivo}`),
    ].join('\n');
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(textoResultado());
      setEstadoCopia('Resultado copiado.');
    } catch {
      setEstadoCopia('No se pudo copiar. Seleccioná el texto y copialo a mano.');
    }
  }

  function descargar() {
    const url = URL.createObjectURL(
      new Blob([textoResultado()], { type: 'text/plain;charset=utf-8' }),
    );
    const enlace = document.createElement('a');
    enlace.href = url;
    const nombreBase = resultado.nombreArchivo.replace(/\.txt$/i, '');
    enlace.download = `resultado_${nombreBase}.txt`;
    document.body.append(enlace);
    enlace.click();
    enlace.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  return (
    <div className="flex flex-col gap-sp-12">
      <div role="status" className="rounded-input bg-surface-subtle p-sp-12 text-text-primary">
        <p className="break-words font-semibold" translate="no">
          {resultado.nombreArchivo}
        </p>
        {resumen.map((linea) => (
          <p key={linea}>{linea}</p>
        ))}
      </div>
      {resultado.rechazadas > 0 ? <ErroresLineasTable errores={resultado.errores} /> : null}
      <p>El resultado no se guarda. Copialo o descargalo antes de salir.</p>
      <div className="flex flex-wrap gap-sp-8">
        <Button
          label="Copiar resultado"
          variant="secondary"
          onClick={copiar}
          className="hover:bg-surface-subtle"
        />
        <Button
          label="Descargar resultado"
          variant="secondary"
          onClick={descargar}
          className="hover:bg-surface-subtle"
        />
      </div>
      <div role="status">{estadoCopia}</div>
    </div>
  );
}
