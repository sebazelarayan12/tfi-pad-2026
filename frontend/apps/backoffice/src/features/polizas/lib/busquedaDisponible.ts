/**
 * PB-06: el back todavía ignora `numero` y `dni` en `GET /api/polizas` y devolvería todas las
 * pólizas como si fueran el resultado. Mientras sea `false`, esas dos búsquedas no hacen request.
 * Pasar a `true` solo cuando PB-06 esté publicado; no se activa con `VITE_USE_MOCKS` (RV-D29).
 */
export const BUSQUEDA_NUMERO_DNI_DISPONIBLE = false;
