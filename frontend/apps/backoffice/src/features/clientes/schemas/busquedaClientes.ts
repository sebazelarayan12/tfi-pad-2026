import { quitarFormatoDni, type ClienteFiltro } from '@nexa/api';
import { z } from 'zod';

export const busquedaClientes = z
  .string()
  .max(100)
  .transform((valor): Pick<ClienteFiltro, 'dni' | 'apellido'> => {
    const texto = valor.replaceAll('.', '').trim();
    const dni = quitarFormatoDni(texto);
    if (/^\d{8}$/.test(dni)) return { dni };
    return texto ? { apellido: texto } : {};
  });
