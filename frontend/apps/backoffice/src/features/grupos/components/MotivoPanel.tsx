import { Button, CardWidget, Input } from '@nexa/ui';
import { useState, type FormEvent } from 'react';

interface MotivoPanelProps {
  titulo: string;
  etiquetaConfirmar: string;
  enviando: boolean;
  onCancelar: () => void;
  onConfirmar: (motivo: string) => void;
}

const MENSAJE_OBLIGATORIO = 'Escribí el motivo: el grupo lo va a leer.';
const LONGITUD_MAXIMA = 300;

/** Pide el motivo de un rechazo o una revocación. El grupo lo ve en su panel, por eso es obligatorio. */
export function MotivoPanel({
  titulo,
  etiquetaConfirmar,
  enviando,
  onCancelar,
  onConfirmar,
}: MotivoPanelProps) {
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState(false);

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    const limpio = motivo.trim();
    if (limpio === '') {
      setError(true);
      return;
    }
    onConfirmar(limpio);
  }

  return (
    <CardWidget title={titulo}>
      <form noValidate onSubmit={enviar} className="flex flex-col gap-sp-16">
        <Input
          label="Motivo"
          value={motivo}
          maxLength={LONGITUD_MAXIMA}
          disabled={enviando}
          error={error}
          helper={error ? MENSAJE_OBLIGATORIO : undefined}
          onChange={(evento) => {
            setMotivo(evento.target.value);
            setError(false);
          }}
        />
        <div className="flex gap-sp-8">
          <Button label="Cancelar" variant="secondary" size="s" onClick={onCancelar} />
          <Button
            type="submit"
            label={etiquetaConfirmar}
            size="s"
            disabled={enviando}
            aria-busy={enviando}
          />
        </div>
      </form>
    </CardWidget>
  );
}
