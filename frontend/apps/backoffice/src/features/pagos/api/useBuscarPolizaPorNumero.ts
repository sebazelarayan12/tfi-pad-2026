import {
  buscarPolizasMock,
  polizasKeys,
  useApiClient,
  type PolizaListItemResponse,
} from '@nexa/api';
import { useQuery } from '@tanstack/react-query';

import { BUSQUEDA_POLIZA_NUMERO_DISPONIBLE } from '../config';
import { buscarPolizaSchema } from '../schemas/buscarPoliza';

/**
 * MOCK (PB-06): busca una póliza por número exacto. Sin request si la constante está en `false`
 * (RV-D29) o si el formato no es `POL-0000001`. Devuelve `null` si ninguna coincide.
 */
export function useBuscarPolizaPorNumero(numero: string) {
  const api = useApiClient();
  const valido = buscarPolizaSchema.safeParse({ numero });
  const habilitada = BUSQUEDA_POLIZA_NUMERO_DISPONIBLE && valido.success;
  const numeroValido = valido.success ? valido.data.numero : '';

  return useQuery<PolizaListItemResponse | null>({
    queryKey: polizasKeys.lista({ numero: numeroValido }),
    queryFn: async () => {
      const pagina = await buscarPolizasMock(api, { numero: numeroValido });
      return pagina.items.find((poliza) => poliza.numero === numeroValido) ?? null;
    },
    enabled: habilitada,
  });
}
