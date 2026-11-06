import { listarRendiciones, pagoFacilKeys, useApiClient, ZONA_ARGENTINA } from '@nexa/api';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

const diaArgentina = new Intl.DateTimeFormat('sv-SE', {
  timeZone: ZONA_ARGENTINA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function useRendicionPendienteHoy() {
  const cliente = useApiClient();
  const [hoy] = useState(() => diaArgentina.format(new Date()));
  const historial = useQuery({
    queryKey: pagoFacilKeys.rendiciones(),
    queryFn: () => listarRendiciones(cliente),
    retry: false,
  });
  if (!historial.isSuccess) return false;
  return !historial.data.some((rendicion) => rendicion.fechaRendicion === hoy);
}
