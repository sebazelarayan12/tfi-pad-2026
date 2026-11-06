import type { CuotaPublica } from '@nexa/api';
import { useState } from 'react';

import { formatearListaCuotas } from '../../../shared/formato/listaCuotas';

/** `MaximoCuotas` del back: una sola operación de pago admite hasta 24 cuotas. */
export const MAXIMO_CUOTAS = 24;

/** Solo las impagas se pueden elegir; PAGADA y ANULADA no (RN11). */
export function esCuotaElegible(cuota: CuotaPublica): boolean {
  return cuota.estado === 'PENDIENTE' || cuota.estado === 'VENCIDA';
}

/** Suma en centavos enteros para no acumular error de punto flotante (convenciones §5.4). */
function sumarImportes(cuotas: ReadonlyArray<CuotaPublica>): number {
  const centavos = cuotas.reduce((acumulado, cuota) => acumulado + Math.round(cuota.total * 100), 0);
  return centavos / 100;
}

export interface SeleccionCuotas {
  estaSeleccionada: (idCuota: string) => boolean;
  /** Con el tope alcanzado, las cuotas sin marcar no se pueden agregar. */
  estaBloqueada: (cuota: CuotaPublica) => boolean;
  alternar: (cuota: CuotaPublica) => void;
  /** Agrega las elegibles hasta el tope, sin quitar las ya marcadas. */
  seleccionarImpagas: () => void;
  cuotaIds: string[];
  numerosSeleccionados: number[];
  cantidadSeleccionadas: number;
  total: number;
  listaNumeros: string;
  alcanzoTope: boolean;
}

/** Selección de cuotas a pagar (W3 §6): solo impagas, hasta 24, total en centavos enteros. */
export function useSeleccionCuotas(cuotas: ReadonlyArray<CuotaPublica>): SeleccionCuotas {
  const [marcadas, setMarcadas] = useState<ReadonlySet<string>>(new Set());

  const seleccionadas = cuotas
    .filter((cuota) => marcadas.has(cuota.idCuota))
    .sort((a, b) => a.numero - b.numero);
  const alcanzoTope = seleccionadas.length >= MAXIMO_CUOTAS;
  const numerosSeleccionados = seleccionadas.map((cuota) => cuota.numero);

  function alternar(cuota: CuotaPublica) {
    if (!esCuotaElegible(cuota)) return;
    setMarcadas((actuales) => {
      const siguientes = new Set(actuales);
      if (siguientes.has(cuota.idCuota)) {
        siguientes.delete(cuota.idCuota);
      } else if (siguientes.size < MAXIMO_CUOTAS) {
        siguientes.add(cuota.idCuota);
      }
      return siguientes;
    });
  }

  function seleccionarImpagas() {
    setMarcadas((actuales) => {
      const siguientes = new Set(actuales);
      for (const cuota of cuotas) {
        if (siguientes.size >= MAXIMO_CUOTAS) break;
        if (esCuotaElegible(cuota)) siguientes.add(cuota.idCuota);
      }
      return siguientes;
    });
  }

  return {
    estaSeleccionada: (idCuota) => marcadas.has(idCuota),
    estaBloqueada: (cuota) => alcanzoTope && !marcadas.has(cuota.idCuota),
    alternar,
    seleccionarImpagas,
    cuotaIds: seleccionadas.map((cuota) => cuota.idCuota),
    numerosSeleccionados,
    cantidadSeleccionadas: seleccionadas.length,
    total: sumarImportes(seleccionadas),
    listaNumeros: formatearListaCuotas(numerosSeleccionados),
    alcanzoTope,
  };
}
