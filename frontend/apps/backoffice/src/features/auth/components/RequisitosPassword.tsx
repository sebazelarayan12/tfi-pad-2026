import { REQUISITOS_PASSWORD } from '../schemas/cambiarPasswordSchema';

interface RequisitosPasswordProps {
  id: string;
  valor: string;
}

/**
 * Lista de requisitos de la contraseña nueva, marcada en vivo. El estado se dice con texto
 * (`Cumplido` / `Pendiente`) además del color y el ícono.
 */
export function RequisitosPassword({ id, valor }: RequisitosPasswordProps) {
  return (
    <ul id={id} aria-live="polite" className="flex flex-col gap-sp-8 text-body-sm">
      {REQUISITOS_PASSWORD.map((requisito) => {
        const cumplido = requisito.cumple(valor);
        return (
          <li
            key={requisito.id}
            className={cumplido ? 'text-status-vigente-text' : 'text-text-secondary'}
          >
            <span aria-hidden="true">{cumplido ? '✓ ' : '○ '}</span>
            {requisito.texto}
            <span className="sr-only">{cumplido ? ': Cumplido' : ': Pendiente'}</span>
          </li>
        );
      })}
    </ul>
  );
}
