import '@nexa/ui/tokens.css';
import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';

import { Providers } from './app/providers';
import { router } from './app/router';

const raiz = document.getElementById('root');
if (raiz === null) throw new Error('Falta el elemento #root');

createRoot(raiz).render(
  <StrictMode>
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  </StrictMode>,
);
