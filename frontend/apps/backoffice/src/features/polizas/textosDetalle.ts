/** Textos literales de B10 (ficha US-FE-B-15 §8 y §13). */
export const TEXTO_VOLVER_POLIZAS = 'Pólizas';
export const TEXTO_NO_DISPONIBLE_DETALLE = 'No disponible';
export const TITULO_CICLO = 'Ciclo de vida';
export const TITULO_DATOS = 'Datos';
export const TITULO_CUOTAS = 'Cuotas';
export const ETIQUETA_ACCIONES = 'Acciones de la póliza';
export const ETIQUETA_COLUMNA_DERECHA = 'Resumen de la póliza';
export const CAPTION_CUOTAS = 'Cuotas de la póliza';
export const NOTA_RECARGO = 'Vencen el día 10 de cada mes. Recargo del 5% al vencer.';
export const AVISO_SUSPENSION =
  'Se suspendió por 2 cuotas vencidas impagas. Vuelve a Vigente al pagarlas.';
export const TEXTO_SIN_CUOTAS = 'No hay cuotas para esta póliza.';
export const TEXTO_ERROR_DETALLE = 'No se pudo cargar la póliza. Intentá de nuevo.';
export const TEXTO_SIN_PERMISO = 'No tenés permiso para ver esta póliza.';
export const NOTA_AL_PAGAR_VENCIDAS = 'Al pagar las vencidas';

export const mensajeNoExiste = (id: string) => `La póliza ${id} no existe.`;

/** Rail de B-18 (ficha US-FE-B-18 §8). */
export const TITULO_DEUDA_VENCIDA = 'Deuda vencida';
export const TITULO_PAGOS = 'Pagos';
export const TEXTO_SIN_VENCIDAS = 'Sin cuotas vencidas.';
export const TEXTO_CUOTAS_A_COBRAR = 'Cuotas a cobrar';
export const TEXTO_TOTAL_A_COBRAR = 'Total a cobrar';
export const TEXTO_SIN_PAGOS = 'Sin pagos registrados.';
export const TEXTO_ERROR_PAGOS = 'No se pudieron cargar los pagos.';
export const detalleVencidas = (numeros: string, cantidad: number) =>
  `${cantidad === 1 ? 'Cuota' : 'Cuotas'} ${numeros}, con recargo del 5%`;
