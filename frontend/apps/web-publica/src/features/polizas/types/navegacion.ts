import type { z } from 'zod';

import type { estadoMiPolizaSchema, estadoPagoPublicoSchema } from '../schemas/navegacion';

/** Estado que deja W2 y consumen W3/W4 (W-03 §6.2). */
export type EstadoMiPoliza = z.infer<typeof estadoMiPolizaSchema>;

/** Estado de W2 más las cuotas elegidas; lo consumen W6/W7 (W-03 §6.2). */
export type EstadoPagoPublico = z.infer<typeof estadoPagoPublicoSchema>;

/** Unión de los dos estados posibles de `location.state` en las pantallas públicas. */
export type EstadoNavegacion = EstadoMiPoliza | EstadoPagoPublico;
