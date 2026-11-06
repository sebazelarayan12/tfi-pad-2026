import { variantesPagoFacil } from '@nexa/api/mocks/handlers/pagofacil';
import { servidorMock } from '@nexa/api/mocks/server';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { expect, it, vi } from 'vitest';
import { proveedoresRendicion } from '../test/proveedoresRendicion';
import { RendicionCard } from './RendicionCard';

const endpoint = '*/api/pagofacil/rendiciones';
const archivo = new File(['123'], 'rendicion.txt');

function montar() {
  const usuario = userEvent.setup({ applyAccept: false });
  const { wrapper } = proveedoresRendicion();
  render(<RendicionCard />, { wrapper });
  const input = screen.getByLabelText('Archivo de rendición');
  const boton = screen.getByRole('button', { name: 'elegilo desde tu equipo' });
  return { usuario, input, boton };
}

it('no llama a la API para archivos inválidos', async () => {
  const peticion = vi.fn(() => new HttpResponse(null, { status: 500 }));
  servidorMock.use(http.post(endpoint, peticion));
  const { usuario, input } = montar();
  await usuario.upload(input, new File([''], 'rendicion.csv'));
  expect(screen.getByRole('alert')).toHaveTextContent('Elegí un archivo .txt.');
  expect(peticion).not.toHaveBeenCalled();
});

it('envía el archivo en el campo multipart archivo', async () => {
  const archivoRecibido = vi.fn();
  servidorMock.use(
    http.post(endpoint, async ({ request }) => {
      const recibido = (await request.formData()).get('archivo');
      archivoRecibido(recibido !== null && typeof recibido !== 'string');
      return HttpResponse.json({ detail: 'Error de prueba.' }, { status: 400 });
    }),
  );
  const { usuario, input } = montar();
  // El puente de Vitest convierte File en Blob al pasar de jsdom a Request.
  const adjuntar = vi.spyOn(FormData.prototype, 'append');
  await usuario.upload(input, archivo);
  await screen.findByRole('alert');
  try {
    expect(adjuntar).toHaveBeenCalledWith('archivo', expect.objectContaining({ name: archivo.name }));
    expect(archivoRecibido).toHaveBeenCalledWith(true);
  } finally {
    adjuntar.mockRestore();
  }
});

it('un 201 sin rechazos muestra el resumen sin tabla', async () => {
  const { usuario, input } = montar();
  await usuario.upload(input, archivo);
  expect(await screen.findByText('Líneas procesadas: 3 de 3.')).toBeInTheDocument();
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
});

it('un 201 parcial muestra línea y motivo sin alerta', async () => {
  servidorMock.use(variantesPagoFacil.rendicionConRechazos);
  const { usuario, input } = montar();
  await usuario.upload(input, archivo);
  const tabla = await screen.findByRole('table', { name: 'Líneas rechazadas' });
  expect(within(tabla).getByRole('columnheader', { name: 'Línea' })).toHaveAttribute(
    'scope',
    'col',
  );
  expect(within(tabla).getByRole('columnheader', { name: 'Motivo' })).toBeInTheDocument();
  expect(within(tabla).getByText(/dígito verificador/)).toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it('muestra el texto del backend para un archivo duplicado', async () => {
  servidorMock.use(variantesPagoFacil.rendicionYaProcesada(archivo.name));
  const { usuario, input } = montar();
  await usuario.upload(input, archivo);
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'El archivo rendicion.txt ya fue procesado (RN18).',
  );
});

it('separa tres motivos de líneas mal formadas', async () => {
  servidorMock.use(
    http.post(endpoint, () =>
      HttpResponse.json(
        {
          detail:
            'El archivo de rendición tiene líneas mal formadas: línea 1: longitud; línea 2: dígitos; línea 3: fecha',
        },
        { status: 400 },
      ),
    ),
  );
  const { usuario, input } = montar();
  await usuario.upload(input, archivo);
  const aviso = await screen.findByRole('alert');
  expect(
    within(aviso)
      .getAllByRole('listitem')
      .map((item) => item.textContent),
  ).toEqual(['línea 1: longitud', 'línea 2: dígitos', 'línea 3: fecha']);
});

it('hace un solo envío ante un fallo de red', async () => {
  const peticion = vi.fn(() => HttpResponse.error());
  servidorMock.use(http.post(endpoint, peticion));
  const { usuario, input } = montar();
  await usuario.upload(input, archivo);
  expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo conectar.');
  expect(peticion).toHaveBeenCalledTimes(1);
});

it('deshabilita la dropzone y no acepta otro archivo durante la subida', async () => {
  let terminar = () => {};
  const pendiente = new Promise<void>((resolve) => {
    terminar = resolve;
  });
  const peticion = vi.fn(async () => {
    await pendiente;
    return HttpResponse.json({ detail: 'Error de prueba.' }, { status: 400 });
  });
  servidorMock.use(http.post(endpoint, peticion));
  const { usuario, input, boton } = montar();
  try {
    await usuario.upload(input, archivo);
    await waitFor(() => expect(boton).toBeDisabled());
    expect(input).toBeDisabled();
    expect(screen.getByText('Subiendo archivo…')).toBeInTheDocument();
    fireEvent.drop(boton, { dataTransfer: { files: [archivo] } });
  } finally {
    terminar();
  }
  await screen.findByRole('alert');
  expect(peticion).toHaveBeenCalledTimes(1);
});

it('Enter abre el selector de archivos', async () => {
  const { usuario, input, boton } = montar();
  const click = vi.spyOn(input, 'click');
  await usuario.tab();
  expect(boton).toHaveFocus();
  await usuario.keyboard('{Enter}');
  expect(click).toHaveBeenCalledOnce();
});
