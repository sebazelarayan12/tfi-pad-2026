// @vitest-environment node
import { contratoEndpoint } from './harness';
import { GUID_VACIO } from '../../mocks/fixtures/vehiculos';
import { variantesCotizaciones } from '../../mocks/handlers/cotizaciones';
import { servidorMock } from '../../mocks/server';
import {
  esMock,
  esquemaCotizacion,
  esquemaResultado,
  erroresAuth,
  idCotizacion,
  idVehiculo,
  instalarFixtures,
  solicitud,
} from './soporte-vehiculos-cotizaciones';

instalarFixtures();
const ruta = '/api/cotizaciones';
const cuerpo = () => ({ vehiculoId: idVehiculo() });
contratoEndpoint({
  nombre: 'Cotizar al clic (cada POST persiste opciones nuevas)',
  metodo: 'POST',
  ruta,
  requiereSesion: true,
  destructivo: true,
  exito: {
    estado: 201,
    esquema: esquemaResultado,
    request: () => solicitud(ruta, 'POST', cuerpo()),
  },
  errores: [
    ...erroresAuth(ruta, 'POST', cuerpo()),
    {
      nombre: 'falta vehículo',
      estado: 400,
      esquema: 'validation',
      request: () => solicitud(ruta, 'POST', {}),
    },
    {
      nombre: 'vehículo inexistente',
      estado: 404,
      esquema: 'problem',
      request: () => solicitud(ruta, 'POST', { vehiculoId: GUID_VACIO }),
    },
    ...(esMock
      ? [
          {
            nombre: 'sin planes compatibles (fixture MSW)',
            estado: 400,
            esquema: 'problem' as const,
            request: () => {
              servidorMock.use(variantesCotizaciones.cotizarSinPlanes);
              return solicitud(ruta, 'POST', cuerpo());
            },
          },
        ]
      : []),
  ],
});
contratoEndpoint({
  nombre: 'Detalle de una opción persistida',
  metodo: 'GET',
  ruta: `${ruta}/{id}`,
  requiereSesion: true,
  destructivo: false,
  exito: {
    estado: 200,
    esquema: esquemaCotizacion,
    request: () => solicitud(`${ruta}/${idCotizacion()}`),
  },
  errores: [
    ...erroresAuth(`${ruta}/${GUID_VACIO}`),
    {
      nombre: 'cotización inexistente',
      estado: 404,
      esquema: 'problem',
      request: () => solicitud(`${ruta}/${GUID_VACIO}`),
    },
  ],
});
