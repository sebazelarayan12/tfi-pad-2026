import { Backdrop, Shell } from '@nexa/ui';
import type { ReactNode } from 'react';
import { InterruptorTema } from '../../../marca/tema/InterruptorTema';

interface LayoutAccesoProps {
  children: ReactNode;
}

/**
 * Layout de acceso sin sidebar (B1 §3): formulario centrado y panel de marca a la derecha,
 * que se oculta por debajo de 1024 px. Sin imagen: falta el asset de diseño (D-B01-3).
 */
export function LayoutAcceso({ children }: LayoutAccesoProps) {
  return (
    <Backdrop>
      <div className="p-sp-24">
        <Shell>
          <div className="relative grid min-h-[calc(100dvh-48px)] p-sp-16 pt-sp-64 lg:grid-cols-2 lg:pt-sp-16">
            <InterruptorTema className="absolute right-sp-16 top-sp-16" />
            <main className="flex min-w-0 items-center justify-center px-sp-8 py-sp-24 lg:p-sp-48">
              <div className="w-full max-w-[360px]">{children}</div>
            </main>
            <aside className="hidden flex-col justify-end gap-sp-8 rounded-card bg-accent-lime-soft p-sp-24 lg:flex">
              <h2 className="text-h2 text-text-primary">Panel interno de Nexa Seguros</h2>
              <p className="text-body-sm text-text-secondary">
                Clientes, pólizas, cuotas y cobros en un solo lugar.
              </p>
            </aside>
          </div>
        </Shell>
      </div>
    </Backdrop>
  );
}
