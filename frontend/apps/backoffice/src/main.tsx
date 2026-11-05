import '@nexa/ui/tokens.css';
import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { ProveedoresApp } from './app/providers';

const raiz = document.getElementById('root');
if (raiz === null) throw new Error('Falta el elemento #root');

// Bootstrap de mocks (RV-D03): único lugar que lee el flag. Con `false` no se carga MSW.
async function iniciarMocks(): Promise<void> {
  if (import.meta.env.VITE_USE_MOCKS !== 'true') return;
  const { iniciarMocksSiCorresponde } = await import('@nexa/api/mocks/browser');
  await iniciarMocksSiCorresponde();
}

void iniciarMocks().then(() => {
  createRoot(raiz).render(
    <StrictMode>
      <ProveedoresApp />
    </StrictMode>,
  );
});
