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

/** Acciones de B-16 (ficha US-FE-B-16 §8 y §13, defaults DP-B16-01 a DP-B16-08). */
export const TEXTO_CUPON = 'Cupón Pago Fácil';
export const TEXTO_CANCELAR_POLIZA = 'Cancelar póliza';
export const TITULO_DIALOGO_CANCELAR = (numero: string) => `Cancelar póliza ${numero}`;
export const TEXTO_DIALOGO_CANCELAR =
  'Esta acción anula las cuotas no pagadas y no se puede deshacer.';
export const LABEL_MOTIVO = 'Motivo de cancelación';
export const contadorMotivo = (n: number) => `${n} de 200`;
export const TEXTO_CONFIRMAR_CANCELACION = 'Confirmar cancelación';
export const TEXTO_VOLVER = 'Volver';
export const TEXTO_EXITO_CANCELACION = 'Póliza cancelada.';
export const TEXTO_ERROR_RED_CANCELAR =
  'No se pudo confirmar la cancelación. Recargá la póliza para ver su estado.';
export const TEXTO_CANCELANDO = 'Cancelando la póliza…';
export const TITULO_CUPON = 'Cupón de Pago Fácil';
export const tituloCuota = (numero: number, total: number) => `Cuota ${numero} de ${total}`;
export const ETIQUETA_PRIMER_VENCIMIENTO = 'Primer vencimiento';
export const ETIQUETA_SEGUNDO_VENCIMIENTO = 'Segundo vencimiento';
export const ETIQUETA_CODIGO_BARRAS = 'Código de barras';
export const TEXTO_COPIAR_CODIGO = 'Copiar código';
export const TEXTO_CODIGO_COPIADO = 'Código copiado.';
export const TEXTO_ERROR_COPIAR = 'No se pudo copiar. Seleccionalo y copialo a mano.';
export const TEXTO_CARGANDO_CUPON = 'Generando el cupón…';

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
