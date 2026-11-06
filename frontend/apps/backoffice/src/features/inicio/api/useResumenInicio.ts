import { useApiClient } from '@nexa/api';
import { useQuery } from '@tanstack/react-query';
import type { ResumenInicioResponse } from '../types/resumenInicio';

export function useResumenInicio() {
  const cliente = useApiClient();
  return useQuery({
    queryKey: ['inicio', 'resumen'],
    queryFn: () => cliente.get<ResumenInicioResponse>('/api/inicio/resumen'),
    select: (resumen) => resumen.fechaCorte,
    retry: false,
  });
}
