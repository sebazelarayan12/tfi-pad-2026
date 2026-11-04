import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// `strictPort`: si el 5174 está ocupado, Vite falla en vez de moverse. La API acepta
// un origen exacto (CORS), así que otro puerto dejaría de funcionar.
export default defineConfig({
  plugins: [react()],
  server: { port: 5174, strictPort: true },
  preview: { port: 5174, strictPort: true },
});
