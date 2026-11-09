import { CardWidget, EstadoBadge } from '@nexa/ui';
import { IdentificationCardIcon } from '@phosphor-icons/react/dist/csr/IdentificationCard';

import { CajaErrorRenaper } from './CajaErrorRenaper';
import { mensajeDniRenaper, TEXTOS_RENAPER, type ResultadoRenaper } from './textosRenaper';

function DatosPersona({ fallecido }: { fallecido: boolean }) {
  return (
    <div className="flex flex-col items-start gap-sp-12">
      {/* "Fallecido" no tiene token propio: usa el de error (Cancelada) con su texto. */}
      {fallecido ? (
        <EstadoBadge estado="Cancelada" texto="Fallecido" />
      ) : (
        <EstadoBadge estado="Validado" />
      )}
      <dl className="flex flex-col gap-sp-12">
        <div>
          <dt>Estado</dt>
          <dd className="text-text-primary">{fallecido ? 'Fallecido' : 'Vigente'}</dd>
        </div>
        <div>
          <dt>Fecha de validación</dt>
          <dd className="text-text-primary">{TEXTOS_RENAPER.fechaSinGuardar}</dd>
        </div>
      </dl>
      {fallecido ? <p>{TEXTOS_RENAPER.fallecido}</p> : null}
    </div>
  );
}

/** Rail derecho de B4. El resultado se anuncia con `aria-live="polite"` (B4 §12). */
export function WidgetValidacionRenaper({ resultado }: { resultado: ResultadoRenaper }) {
  const errorDni = mensajeDniRenaper(resultado);
  return (
    <div aria-live="polite">
      <CardWidget title={TEXTOS_RENAPER.titulo} icon={<IdentificationCardIcon size={20} />}>
        <div className="flex flex-col items-start gap-sp-12">
          {resultado.tipo === 'inicial' ? <p>{TEXTOS_RENAPER.inicial}</p> : null}
          {resultado.tipo === 'vigente' || resultado.tipo === 'fallecido' ? (
            <DatosPersona fallecido={resultado.tipo === 'fallecido'} />
          ) : null}
          {errorDni ? <CajaErrorRenaper mensaje={errorDni} /> : null}
          {resultado.tipo === 'caido' ? <CajaErrorRenaper mensaje={TEXTOS_RENAPER.caido} /> : null}
          <p>{TEXTOS_RENAPER.nota}</p>
        </div>
      </CardWidget>
    </div>
  );
}
