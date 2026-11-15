import type { ReactNode } from 'react';

import { LogoMarca } from '../../../marca/LogoMarca';
import { InterruptorTema } from '../../../marca/tema/InterruptorTema';

interface LayoutLoginProps {
  children: ReactNode;
}

export function LayoutLogin({ children }: LayoutLoginProps) {
  return (
    <div className="grid min-h-dvh bg-surface-panel lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-marca-marino p-sp-48 text-white lg:flex lg:items-end">
        <img
          src="/img/login-auto.jpg"
          alt=""
          width={1400}
          height={2096}
          className="absolute inset-0 h-full w-full object-cover object-[center_85%] opacity-55"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-marca-marino" />
        <div className="relative space-y-sp-12">
          <LogoMarca blanco decorativo className="mb-sp-24 h-20 w-auto" />
          <h2 className="text-display">Panel interno de Nexa Seguros</h2>
          <p className="text-body">Clientes, pólizas, cuotas y cobros en un solo lugar.</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col px-sp-16 pb-sp-32 sm:px-sp-32 lg:px-sp-48">
        <header className="mx-auto flex w-full max-w-[480px] items-center justify-between gap-sp-12 py-sp-24">
          <LogoMarca className="h-12 w-auto" />
          <InterruptorTema />
        </header>
        <main className="mx-auto flex w-full max-w-[480px] flex-1 flex-col justify-center py-sp-16">
          {children}
        </main>
      </div>
    </div>
  );
}
