import '@nexa/ui/tokens.css';
import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { ProveedoresApp } from './app/providers';

const raiz = document.getElementById('root');
if (raiz === null) throw new Error('Falta el elemento #root');

createRoot(raiz).render(
  <StrictMode>
    <ProveedoresApp />
  </StrictMode>,
);
