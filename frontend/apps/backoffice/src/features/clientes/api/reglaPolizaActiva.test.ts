import {
  ESTADO_POLIZA_NUMERO,
  type EstadoPolizaNumero,
  type PolizaListItemResponse,
} from '@nexa/api';
import { describe, expect, it } from 'vitest';

import {
  esPolizaActiva,
  normalizarPatente,
  polizaActivaDeVehiculo,
  vehiculoDePoliza,
} from './reglaPolizaActiva';

const poliza = (
  patente: string,
  estado: EstadoPolizaNumero,
  numero = 'POL-0000001',
): PolizaListItemResponse => ({
  id: numero,
  numero,
  clienteId: 'c1',
  patente,
  codigoPlan: 'RC',
  primaMensual: 1000,
  fechaInicio: '2026-11-01',
  fechaFin: '2027-05-01',
  estado,
});

describe('esPolizaActiva (RN04)', () => {
  it('Pendiente, Vigente y Suspendida cuentan; Cancelada y Vencida no', () => {
    const { Pendiente, Vigente, Suspendida, Cancelada, Vencida } = ESTADO_POLIZA_NUMERO;
    expect([Pendiente, Vigente, Suspendida].map((estado) => esPolizaActiva({ estado }))).toEqual([
      true,
      true,
      true,
    ]);
    expect([Cancelada, Vencida].map((estado) => esPolizaActiva({ estado }))).toEqual([
      false,
      false,
    ]);
  });

  it('un estado fuera del mapa no cuenta', () => {
    expect(esPolizaActiva({ estado: 99 as never })).toBe(false);
  });
});

describe('reglaPolizaActiva', () => {
  it('cruza la patente sin distinguir mayúsculas ni espacios', () => {
    expect(normalizarPatente(' ab 123 cd ')).toBe('AB123CD');
    const encontrada = polizaActivaDeVehiculo({ patente: 'AB123CD' }, [
      poliza('ab 123cd', ESTADO_POLIZA_NUMERO.Vigente),
    ]);
    expect(encontrada?.numero).toBe('POL-0000001');
  });

  it('devuelve la primera póliza activa del listado, no la de número mayor', () => {
    const polizas = [
      poliza('AB123CD', ESTADO_POLIZA_NUMERO.Vencida, 'POL-0000009'),
      poliza('AB123CD', ESTADO_POLIZA_NUMERO.Vigente, 'POL-0000005'),
      poliza('AB123CD', ESTADO_POLIZA_NUMERO.Pendiente, 'POL-0000002'),
    ];
    expect(polizaActivaDeVehiculo({ patente: 'AB123CD' }, polizas)?.numero).toBe('POL-0000005');
  });

  it('sin póliza activa devuelve undefined', () => {
    const polizas = [
      poliza('AB123CD', ESTADO_POLIZA_NUMERO.Vencida),
      poliza('AB123CD', ESTADO_POLIZA_NUMERO.Cancelada),
      poliza('ZZ999ZZ', ESTADO_POLIZA_NUMERO.Vigente),
    ];
    expect(polizaActivaDeVehiculo({ patente: 'AB123CD' }, polizas)).toBeUndefined();
  });

  it('el vehículo de una póliza se busca por patente normalizada', () => {
    const vehiculos = [{ patente: 'AB123CD' }, { patente: 'XY000ZZ' }] as never[];
    expect(vehiculoDePoliza({ patente: 'ab123 cd' }, vehiculos)).toBe(vehiculos[0]);
    expect(vehiculoDePoliza({ patente: 'QQ111QQ' }, vehiculos)).toBeUndefined();
  });
});
