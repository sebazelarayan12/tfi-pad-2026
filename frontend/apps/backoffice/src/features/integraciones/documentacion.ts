/**
 * Documentación de la API para grupos externos. Espeja `docs/api-externa.md` y
 * `docs/cotizacion-externa.md`: si cambia el contrato, se cambia en los tres lugares.
 */

export const URL_BASE_API = 'https://api.nexaseguros.me';
export const HEADER_API_KEY = 'X-Api-Key';

export interface RespuestaDoc {
  codigo: number;
  cuando: string;
}

export interface EndpointDoc {
  id: string;
  titulo: string;
  descripcion: string;
  metodo: 'GET' | 'POST';
  ruta: string;
  /** Parámetros de la ruta o del cuerpo, uno por línea de la tabla. */
  parametros: ReadonlyArray<{ nombre: string; detalle: string }>;
  /** Cuerpo del pedido, solo en POST. */
  cuerpoPedido?: string;
  ejemplos: ReadonlyArray<{ titulo: string; json: string }>;
  respuestas: ReadonlyArray<RespuestaDoc>;
  curl: string;
}

export const ENDPOINTS: ReadonlyArray<EndpointDoc> = [
  {
    id: 'seguro-vigente',
    titulo: 'Seguro vigente por patente',
    descripcion:
      'Responde si un vehículo tiene una póliza vigente hoy (fecha de Argentina). Una póliza Suspendida, Cancelada o Vencida no cuenta. Una patente que no está cargada responde tieneSeguro: false con 200; nunca responde 404.',
    metodo: 'GET',
    ruta: '/api/externo/vehiculos/{patente}/seguro-vigente',
    parametros: [
      {
        nombre: 'patente',
        detalle:
          'En la ruta. Formatos AB123CD (Mercosur) y ABC123. Acepta minúsculas y espacios: "ab 123 cd" se interpreta como AB123CD.',
      },
    ],
    ejemplos: [
      {
        titulo: 'Con seguro vigente',
        json: `{
  "patente": "AB123CD",
  "tieneSeguro": true,
  "numeroPoliza": "POL-0000001",
  "plan": "Terceros Completo",
  "vigenteDesde": "2026-11-01",
  "vigenteHasta": "2027-10-31"
}`,
      },
      {
        titulo: 'Sin seguro vigente o patente desconocida',
        json: `{
  "patente": "ZZ999ZZ",
  "tieneSeguro": false
}`,
      },
    ],
    respuestas: [
      { codigo: 200, cuando: 'Consulta correcta, con o sin seguro.' },
      { codigo: 400, cuando: 'La patente no tiene un formato válido.' },
      { codigo: 401, cuando: 'Falta la clave o es incorrecta.' },
    ],
    curl: `curl -H "X-Api-Key: $NEXA_API_KEY" \\
  ${URL_BASE_API}/api/externo/vehiculos/AB123CD/seguro-vigente`,
  },
  {
    id: 'deuda',
    titulo: 'Deuda de un cliente por DNI',
    descripcion:
      'Devuelve las cuotas impagas de un cliente para que tu sistema pueda ofrecerle el pago. No incluye datos de contacto del cliente.',
    metodo: 'GET',
    ruta: '/api/externo/clientes/{dni}/deuda',
    parametros: [{ nombre: 'dni', detalle: 'En la ruta. DNI del cliente, solo dígitos.' }],
    ejemplos: [
      {
        titulo: 'Cliente con deuda',
        json: `{
  "dni": "30123456",
  "cliente": "Nombre Apellido",
  "totalAdeudado": 21525.00,
  "polizas": [
    {
      "numeroPoliza": "POL-0000001",
      "patente": "AB123CD",
      "cuotas": [
        {
          "idCuota": "8f6e0d1a-0000-0000-0000-000000000000",
          "numero": 2,
          "importe": 10500.00,
          "recargo": 525.00,
          "total": 11025.00,
          "vencimiento": "2026-12-10",
          "estado": "Vencida"
        }
      ]
    }
  ]
}`,
      },
      {
        titulo: 'Cliente inexistente (404)',
        json: `{
  "status": 404,
  "detail": "No existe un cliente con ese DNI.",
  "codigo": "CLIENTE_NO_ENCONTRADO"
}`,
      },
    ],
    respuestas: [
      { codigo: 200, cuando: 'Cliente encontrado (puede no tener deuda).' },
      { codigo: 401, cuando: 'Falta la clave o es incorrecta.' },
      { codigo: 404, cuando: 'No existe un cliente con ese DNI. El cuerpo trae codigo.' },
    ],
    curl: `curl -H "X-Api-Key: $NEXA_API_KEY" \\
  ${URL_BASE_API}/api/externo/clientes/30123456/deuda`,
  },
  {
    id: 'cotizacion',
    titulo: 'Cotización externa',
    descripcion:
      'Calcula las opciones de plan para un vehículo sin dar de alta al cliente. Devuelve una cotización por plan compatible, cada una con su propio idCotizacion y vigente por 15 días.',
    metodo: 'POST',
    ruta: '/api/externo/cotizaciones',
    parametros: [
      { nombre: 'tipoVehiculo', detalle: 'AUTO, MOTO o CAMIONETA (en mayúsculas).' },
      { nombre: 'anio', detalle: 'Año del vehículo, entre 1900 y el año actual + 1.' },
      {
        nombre: 'uso',
        detalle: 'PARTICULAR o COMERCIAL (en mayúsculas). Comercial cuesta 1,40 veces más.',
      },
      { nombre: 'edadConductor', detalle: 'Edad del conductor, entre 0 y 120.' },
    ],
    cuerpoPedido: `{
  "tipoVehiculo": "MOTO",
  "anio": 2024,
  "uso": "PARTICULAR",
  "edadConductor": 23
}`,
    ejemplos: [
      {
        titulo: 'Respuesta 201',
        json: `{
  "fechaVencimiento": "2026-11-16T00:00:00Z",
  "opciones": [
    {
      "idCotizacion": "5b1f7c4e-0000-0000-0000-000000000000",
      "codigoPlan": "RC",
      "plan": "Responsabilidad Civil",
      "primaMensual": 10920.00
    },
    {
      "idCotizacion": "6c2a8d5f-0000-0000-0000-000000000000",
      "codigoPlan": "TC",
      "plan": "Terceros Completo",
      "primaMensual": 16380.00
    }
  ]
}`,
      },
    ],
    respuestas: [
      { codigo: 201, cuando: 'Cotización calculada.' },
      { codigo: 400, cuando: 'Algún campo falta o tiene un valor inválido (ProblemDetails).' },
      { codigo: 401, cuando: 'Falta la clave o es incorrecta.' },
    ],
    curl: `curl -X POST ${URL_BASE_API}/api/externo/cotizaciones \\
  -H "X-Api-Key: $NEXA_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"tipoVehiculo":"MOTO","anio":2024,"uso":"PARTICULAR","edadConductor":23}'`,
  },
];

export const EJEMPLO_JAVASCRIPT = `const respuesta = await fetch(
  \`${URL_BASE_API}/api/externo/vehiculos/\${encodeURIComponent(patente)}/seguro-vigente\`,
  { headers: { 'X-Api-Key': process.env.NEXA_API_KEY } },
);

if (respuesta.status === 401) throw new Error('Clave de Nexa inválida');
if (!respuesta.ok) throw new Error(\`Consulta rechazada (\${respuesta.status})\`);

const { tieneSeguro, vigenteHasta } = await respuesta.json();`;

export const EJEMPLO_ERROR = `{
  "status": 400,
  "detail": "La patente debe tener el formato AB123CD o ABC123."
}`;
