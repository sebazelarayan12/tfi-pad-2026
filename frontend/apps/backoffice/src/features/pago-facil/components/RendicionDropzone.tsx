import { FileTextIcon } from '@phosphor-icons/react/dist/csr/FileText';
import { useId, useRef } from 'react';

interface RendicionDropzoneProps {
  subiendo: boolean;
  avisoId?: string;
  onArchivo: (archivo: File) => void;
}

export function RendicionDropzone({ subiendo, avisoId, onArchivo }: RendicionDropzoneProps) {
  const input = useRef<HTMLInputElement>(null);
  const formatoId = useId();
  const descripcion = avisoId ? `${formatoId} ${avisoId}` : formatoId;

  return (
    <div
      className="flex flex-col items-center justify-center gap-sp-4 rounded-card border-[1.5px] border-dashed border-border-strong bg-surface-subtle p-sp-16 text-center"
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = subiendo ? 'none' : 'copy';
      }}
      onDrop={(event) => {
        event.preventDefault();
        const archivo = event.dataTransfer.files[0];
        if (!subiendo && archivo) onArchivo(archivo);
      }}
    >
      <FileTextIcon aria-hidden="true" size={20} />
      <input
        ref={input}
        type="file"
        name="archivo"
        aria-label="Archivo de rendición"
        accept=".txt"
        hidden
        disabled={subiendo}
        onChange={(event) => {
          const archivo = event.currentTarget.files?.[0];
          event.currentTarget.value = '';
          if (!subiendo && archivo) onArchivo(archivo);
        }}
      />
      <p>
        Arrastrá el archivo .txt o{' '}
        <button
          type="button"
          aria-describedby={descripcion}
          disabled={subiendo}
          onClick={() => input.current?.click()}
          className="min-h-6 touch-manipulation rounded-input font-semibold text-text-primary underline hover:decoration-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary disabled:opacity-50"
        >
          elegilo desde tu equipo
        </button>
      </p>
      <p id={formatoId}>Formato de rendición Pago Fácil, hasta 5 MB</p>
      <div role="status">{subiendo ? 'Subiendo archivo…' : null}</div>
    </div>
  );
}
