import { WarningIcon } from '@phosphor-icons/react/dist/csr/Warning';
import type { ResultadoSubida } from '../types/rendicion';

interface RendicionAvisoProps {
  id: string;
  aviso: Extract<ResultadoSubida, { tipo: 'error' }>;
}

export function RendicionAviso({ id, aviso }: RendicionAvisoProps) {
  return (
    <div
      id={id}
      role="alert"
      className={`flex items-start gap-sp-8 break-words rounded-input p-sp-12 ${aviso.duplicado ? 'bg-[var(--nexa-status-suspendida-bg)] text-[var(--nexa-status-suspendida-text)]' : 'border border-border-strong text-text-primary'}`}
    >
      <WarningIcon aria-hidden="true" size={18} className="shrink-0" />
      <div className="min-w-0">
        <p>{aviso.mensaje}</p>
        {aviso.lineas ? (
          <ul className="list-disc pl-sp-20">
            {aviso.lineas.map((linea) => (
              <li key={linea}>{linea}</li>
            ))}
          </ul>
        ) : null}
        {aviso.ayuda ? <p>{aviso.ayuda}</p> : null}
      </div>
    </div>
  );
}
