import { isApiError } from '@nexa/api';
import { AlertaError, Button, CardWidget } from '@nexa/ui';
import { FileTextIcon } from '@phosphor-icons/react/dist/csr/FileText';
import { useDescargarBasePositiva } from '../api/useDescargarBasePositiva';

function mensajeBasePositiva(error: unknown): string | null {
  if (!error) return null;
  if (!isApiError(error)) return 'No se pudo generar la base positiva.';
  if (error.status === 401) return null;
  if (error.status === 403) return 'No tenés permiso para generar la base positiva.';
  if (error.kind === 'red') return 'No se pudo conectar. Revisá la conexión y volvé a intentar.';
  if (error.kind === 'respuesta-invalida') {
    return 'La base positiva llegó con un formato inesperado. No se descargó.';
  }
  return error.detail || 'No se pudo generar la base positiva.';
}

export function BasePositivaCard() {
  const { generar, isPending, error } = useDescargarBasePositiva();
  const mensaje = mensajeBasePositiva(error);

  return (
    <CardWidget title="Base positiva">
      <div className="flex flex-col items-start gap-sp-16">
        <p>Genera el archivo con los cupones vigentes para que Pago Fácil los acepte en caja.</p>
        <Button
          label={isPending ? 'Generando base positiva…' : 'Generar base positiva'}
          icon={<FileTextIcon size={20} />}
          disabled={isPending}
          onClick={generar}
        />
        {mensaje ? <AlertaError>{mensaje}</AlertaError> : null}
      </div>
    </CardWidget>
  );
}
