import type { z } from 'zod';

import type { filtrosPagosSchema } from '../schemas/filtrosPagos';

/** Filtros de la tabla de pagos (B11): medio, estado y página. */
export type FiltrosPagos = z.infer<typeof filtrosPagosSchema>;
