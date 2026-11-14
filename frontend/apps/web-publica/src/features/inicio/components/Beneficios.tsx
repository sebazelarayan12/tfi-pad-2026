import { FileTextIcon } from '@phosphor-icons/react/dist/csr/FileText';
import { MagnifyingGlassIcon } from '@phosphor-icons/react/dist/csr/MagnifyingGlass';
import { ReceiptIcon } from '@phosphor-icons/react/dist/csr/Receipt';
import { WalletIcon } from '@phosphor-icons/react/dist/csr/Wallet';
import type { ReactNode } from 'react';

import { INTERIOR_SECCION, SECCION_BLANCA, TITULO_SECCION } from '../../../marca/estilos';
import { Aparecer } from '../../../shared/animacion/Aparecer';

const TITULO = 'Por qué elegir Nexa';
const TAMANO_ICONO = 24;

interface Beneficio {
  titulo: string;
  texto: string;
  icono: ReactNode;
}

const BENEFICIOS: ReadonlyArray<Beneficio> = [
  {
    titulo: 'Consultá en un minuto',
    texto: 'Con tu DNI y el número de póliza ves el estado y las cuotas, sin crear una cuenta.',
    icono: <MagnifyingGlassIcon size={TAMANO_ICONO} weight="regular" />,
  },
  {
    titulo: 'Pagá como prefieras',
    texto: 'Online con PADI o Pasarela B, o en efectivo con el cupón de Pago Fácil.',
    icono: <WalletIcon size={TAMANO_ICONO} weight="regular" />,
  },
  {
    titulo: 'Cuentas claras',
    texto: 'Cada cuota con su vencimiento y su importe. Si se vence, el recargo es del 5%.',
    icono: <ReceiptIcon size={TAMANO_ICONO} weight="regular" />,
  },
  {
    titulo: 'Tu factura, siempre',
    texto: 'Cada pago aprobado genera su factura, y la podés pedir de nuevo cuando quieras.',
    icono: <FileTextIcon size={TAMANO_ICONO} weight="regular" />,
  },
];

/** Cuatro beneficios del servicio; solo cuenta lo que el sitio realmente hace. */
export function Beneficios() {
  return (
    <section aria-labelledby="titulo-beneficios" className={SECCION_BLANCA}>
      <div className={INTERIOR_SECCION}>
        <Aparecer>
          <h2 id="titulo-beneficios" className={TITULO_SECCION}>
            {TITULO}
          </h2>
        </Aparecer>
        <ul className="grid grid-cols-1 gap-x-sp-32 gap-y-sp-40 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFICIOS.map((beneficio, indice) => (
            <li key={beneficio.titulo}>
              <Aparecer retardoMs={indice * 100} className="h-full">
                <div className="flex h-full flex-col gap-sp-16 border-t border-border-hairline pt-sp-24">
                  <span
                    aria-hidden="true"
                    className="inline-flex size-12 items-center justify-center rounded-input bg-marca-celeste-suave text-tema-acento"
                  >
                    {beneficio.icono}
                  </span>
                  <h3 className="text-titulo-md">{beneficio.titulo}</h3>
                  <p className="text-body text-text-secondary">{beneficio.texto}</p>
                </div>
              </Aparecer>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
