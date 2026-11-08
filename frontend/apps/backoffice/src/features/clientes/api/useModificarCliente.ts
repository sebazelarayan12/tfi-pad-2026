import {
  clientesKeys,
  modificarCliente,
  useApiClient,
  type ClienteModificacionRequest,
} from '@nexa/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

const clienteCompleto = z.object({
  id: z.string(),
  dni: z.string(),
  cuil: z.string(),
  nombre: z.string(),
  apellido: z.string(),
  fechaNacimiento: z.string(),
  sexo: z.enum(['M', 'F', 'X']),
  email: z.string(),
  telefono: z.string().nullable(),
  calle: z.string(),
  numero: z.string(),
  localidad: z.string(),
  provincia: z.string(),
  codigoPostal: z.string(),
  validadoRenaper: z.boolean(),
  fechaValidacionRenaper: z.string().nullable(),
  activo: z.boolean(),
});

export function useModificarCliente(id: string) {
  const api = useApiClient();
  const cache = useQueryClient();
  const detalle = clientesKeys.detalle(id);
  return useMutation({
    mutationFn: (cambios: ClienteModificacionRequest) => modificarCliente(api, id, cambios),
    onSuccess: async (respuesta) => {
      const cliente = clienteCompleto.safeParse(respuesta);
      if (cliente.success && cliente.data.id === id) cache.setQueryData(detalle, cliente.data);
      await Promise.all([
        cache.invalidateQueries({ queryKey: clientesKeys.listas() }),
        cache.invalidateQueries({ queryKey: detalle }),
      ]);
    },
    retry: 0,
    networkMode: 'always',
  });
}
