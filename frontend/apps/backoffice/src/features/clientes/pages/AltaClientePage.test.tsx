import { ApiClientProvider, createApiClient, type ClienteResponse } from '@nexa/api';
import { clientesFixture } from '@nexa/api/mocks/fixtures/clientes';
import { servidorMock } from '@nexa/api/mocks/server';
import { Toaster } from '@nexa/ui';
import { expectSinViolacionesA11y } from '@nexa/ui/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MENSAJES_ALTA } from '../schemas/altaClienteSchema';
import { AltaClientePage } from './AltaClientePage';

const base = clientesFixture[0]!.cliente;

function Listado() {
  const { state } = useLocation() as { state: { aviso?: { tipo: string; texto: string } } | null };
  return (
    <div>
      <h1>Listado de clientes</h1>
      {state?.aviso ? (
        <p data-testid="aviso">{`${state.aviso.tipo}|${state.aviso.texto}`}</p>
      ) : null}
    </div>
  );
}

function montar() {
  const usuario = userEvent.setup();
  const cliente = createApiClient({ baseUrl: 'https://api.test', getToken: () => 'mock' });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  const router = createMemoryRouter(
    [
      { path: '/clientes/nuevo', element: <AltaClientePage /> },
      { path: '/clientes', element: <Listado /> },
    ],
    { initialEntries: ['/clientes/nuevo'] },
  );
  const vista = render(
    <ApiClientProvider client={cliente}>
      <QueryClientProvider client={queryClient}>
        <Toaster />
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ApiClientProvider>,
  );
  return { usuario, router, queryClient, ...vista };
}

const campo = (nombre: string) => screen.getByLabelText(nombre) as HTMLInputElement;
const guardar = () => screen.getByRole('button', { name: 'Guardar cliente' });

const DATOS = {
  DNI: '35.874.219',
  Nombre: 'Ana',
  Apellido: 'Gómez',
  CUIL: '27358742196',
  'Fecha de nacimiento': '14021990',
  Email: 'ana.gomez@example.test',
  Teléfono: '11 2345-6789',
  Calle: 'Calle Falsa',
  Número: '123',
  Localidad: 'Rosario',
  'Código postal': '2000',
};

async function completar(usuario: UserEvent, omitir: string[] = []) {
  for (const [nombre, valor] of Object.entries(DATOS)) {
    if (omitir.includes(nombre)) continue;
    await usuario.type(campo(nombre), valor);
  }
  if (!omitir.includes('Sexo')) await usuario.selectOptions(campo('Sexo'), 'F');
  if (!omitir.includes('Provincia')) await usuario.selectOptions(campo('Provincia'), 'Santa Fe');
}

function capturarAlta(responder?: (cuerpo: Record<string, unknown>) => Response) {
  const pedidos: Record<string, unknown>[] = [];
  servidorMock.use(
    http.post('*/api/clientes', async ({ request }) => {
      const cuerpo = (await request.json()) as Record<string, unknown>;
      pedidos.push(cuerpo);
      if (responder) return responder(cuerpo);
      const respuesta: ClienteResponse = { ...base, validadoRenaper: true };
      return HttpResponse.json(respuesta, { status: 201 });
    }),
  );
  return pedidos;
}

afterEach(() => vi.restoreAllMocks());

describe('AltaClientePage: estructura', () => {
  it('tiene el enlace Clientes y tres grupos con legend', () => {
    montar();
    expect(screen.getByRole('link', { name: 'Clientes' })).toHaveAttribute('href', '/clientes');
    for (const nombre of ['Datos personales', 'Contacto', 'Domicilio']) {
      expect(screen.getByRole('group', { name: nombre })).toBeInTheDocument();
    }
  });

  it('todos los campos tienen label visible', () => {
    montar();
    for (const nombre of [
      'DNI',
      'Sexo',
      'Nombre',
      'Apellido',
      'CUIL',
      'Fecha de nacimiento',
      'Email',
      'Teléfono',
      'Calle',
      'Número',
      'Localidad',
      'Provincia',
      'Código postal',
    ]) {
      expect(screen.getByLabelText(nombre)).toBeInTheDocument();
    }
    expect(screen.queryByRole('button', { name: /Renaper/ })).toBeNull();
  });

  it('sexo ofrece Femenino, Masculino y X; provincia ofrece 24 opciones en orden', () => {
    montar();
    const sexo = within(campo('Sexo'));
    expect(sexo.getAllByRole('option').map((o) => o.textContent)).toEqual([
      'Femenino',
      'Masculino',
      'X',
    ]);
    const provincias = within(campo('Provincia')).getAllByRole('option');
    expect(provincias).toHaveLength(24);
    expect(provincias[0]).toHaveTextContent('Buenos Aires');
    expect(provincias[23]).toHaveTextContent('Tucumán');
  });

  it('no tiene violaciones de accesibilidad', async () => {
    const { container } = montar();
    await expectSinViolacionesA11y(container);
  });
});

describe('AltaClientePage: validación en el front', () => {
  it('enviar vacío marca los campos, no llama a la API y enfoca el primero', async () => {
    const pedidos = capturarAlta();
    const { usuario } = montar();
    await usuario.click(guardar());
    expect(await screen.findByText(MENSAJES_ALTA.dni)).toBeInTheDocument();
    expect(screen.getByText(MENSAJES_ALTA.nombre)).toBeInTheDocument();
    expect(screen.getByText(MENSAJES_ALTA.apellido)).toBeInTheDocument();
    expect(screen.getByText(MENSAJES_ALTA.cuil)).toBeInTheDocument();
    expect(screen.getByText(MENSAJES_ALTA.fechaObligatoria)).toBeInTheDocument();
    expect(screen.getByText(MENSAJES_ALTA.emailObligatorio)).toBeInTheDocument();
    expect(screen.getByText(MENSAJES_ALTA.sexo)).toBeInTheDocument();
    expect(screen.getByText(MENSAJES_ALTA.provincia)).toBeInTheDocument();
    expect(screen.getByText(MENSAJES_ALTA.calle)).toBeInTheDocument();
    expect(screen.getByText(MENSAJES_ALTA.numero)).toBeInTheDocument();
    expect(screen.getByText(MENSAJES_ALTA.localidad)).toBeInTheDocument();
    expect(screen.getByText(MENSAJES_ALTA.codigoPostal)).toBeInTheDocument();
    expect(campo('DNI')).toHaveAttribute('aria-invalid', 'true');
    await waitFor(() => expect(campo('DNI')).toHaveFocus());
    expect(pedidos).toHaveLength(0);
  });

  it('el DNI de 7 dígitos es inválido y con puntos se acepta', async () => {
    const { usuario } = montar();
    await usuario.type(campo('DNI'), '1234567');
    await usuario.click(guardar());
    expect(await screen.findByText(MENSAJES_ALTA.dni)).toBeInTheDocument();
  });

  it('el CUIL se escribe con la máscara XX-XXXXXXXX-X', async () => {
    const { usuario } = montar();
    await usuario.type(campo('CUIL'), '27358742196');
    expect(campo('CUIL').value).toBe('27-35874219-6');
  });

  it('CUIL de 10 dígitos muestra su error', async () => {
    const { usuario } = montar();
    await usuario.type(campo('CUIL'), '2735874219');
    await usuario.click(guardar());
    expect(await screen.findByText(MENSAJES_ALTA.cuil)).toBeInTheDocument();
  });

  it('la fecha se escribe con barras puestas; una inválida y una de menor muestran su error', async () => {
    const { usuario } = montar();
    await usuario.type(campo('Fecha de nacimiento'), '31021990');
    expect(campo('Fecha de nacimiento').value).toBe('31/02/1990');
    await usuario.click(guardar());
    expect(await screen.findByText(MENSAJES_ALTA.fechaInvalida)).toBeInTheDocument();
    await usuario.clear(campo('Fecha de nacimiento'));
    await usuario.type(campo('Fecha de nacimiento'), '14022010');
    await usuario.click(guardar());
    expect(await screen.findByText(MENSAJES_ALTA.menor)).toBeInTheDocument();
  });

  it('el calendario completa el campo de fecha', async () => {
    const { usuario, container } = montar();
    const calendario = container.querySelector<HTMLInputElement>('input[type="date"]')!;
    expect(calendario.max).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    fireEvent.change(calendario, { target: { value: '1990-02-14' } });
    await waitFor(() => expect(campo('Fecha de nacimiento').value).toBe('14/02/1990'));
    await usuario.click(guardar());
    expect(screen.queryByText(MENSAJES_ALTA.fechaInvalida)).toBeNull();
  });

  it('el botón del calendario abre el selector del navegador', async () => {
    const { usuario, container } = montar();
    const calendario = container.querySelector<HTMLInputElement>('input[type="date"]')!;
    const abrir = vi.fn();
    calendario.showPicker = abrir;
    await usuario.click(screen.getByRole('button', { name: 'Elegir en el calendario' }));
    expect(abrir).toHaveBeenCalledTimes(1);
  });

  it('email inválido muestra su error', async () => {
    const { usuario } = montar();
    await usuario.type(campo('Email'), 'sin-arroba');
    await usuario.click(guardar());
    expect(await screen.findByText(MENSAJES_ALTA.emailFormato)).toBeInTheDocument();
  });

  it('el teléfono admite vacío y rechaza un formato no argentino', async () => {
    const { usuario } = montar();
    await usuario.type(campo('Teléfono'), '12345');
    await usuario.click(guardar());
    expect(await screen.findByText(MENSAJES_ALTA.telefono)).toBeInTheDocument();
    await usuario.clear(campo('Teléfono'));
    await usuario.click(guardar());
    await waitFor(() => expect(screen.queryByText(MENSAJES_ALTA.telefono)).toBeNull());
  });

  it('número y código postal solo admiten dígitos', async () => {
    const { usuario } = montar();
    await usuario.type(campo('Número'), '12B');
    await usuario.type(campo('Código postal'), 'S2000');
    await usuario.click(guardar());
    expect(await screen.findByText(MENSAJES_ALTA.numeroFormato)).toBeInTheDocument();
    expect(screen.getByText(MENSAJES_ALTA.codigoPostalFormato)).toBeInTheDocument();
  });
});

describe('AltaClientePage: envío', () => {
  it('el body tiene las claves y tipos de ClienteAltaRequest', async () => {
    const pedidos = capturarAlta();
    const { usuario } = montar();
    await completar(usuario);
    await usuario.click(guardar());
    await waitFor(() => expect(pedidos).toHaveLength(1));
    expect(pedidos[0]).toEqual({
      dni: '35874219',
      sexo: 'F',
      nombre: 'Ana',
      apellido: 'Gómez',
      cuil: '27358742196',
      fechaNacimiento: '1990-02-14',
      email: 'ana.gomez@example.test',
      telefono: '11 2345-6789',
      calle: 'Calle Falsa',
      numero: '123',
      localidad: 'Rosario',
      provincia: 'Santa Fe',
      codigoPostal: '2000',
    });
  });

  it('el teléfono vacío se envía como null', async () => {
    const pedidos = capturarAlta();
    const { usuario } = montar();
    await completar(usuario, ['Teléfono']);
    await usuario.click(guardar());
    await waitFor(() => expect(pedidos).toHaveLength(1));
    expect(pedidos[0]!.telefono).toBeNull();
  });

  it('201 con validadoRenaper=true navega a /clientes con aviso de éxito', async () => {
    capturarAlta();
    const { usuario, router } = montar();
    await completar(usuario);
    await usuario.click(guardar());
    expect(await screen.findByTestId('aviso')).toHaveTextContent('exito|Cliente guardado.');
    expect(router.state.location.pathname).toBe('/clientes');
  });

  it('201 con validadoRenaper=false navega con aviso de advertencia', async () => {
    capturarAlta(() => HttpResponse.json({ ...base, validadoRenaper: false }, { status: 201 }));
    const { usuario } = montar();
    await completar(usuario);
    await usuario.click(guardar());
    expect(await screen.findByTestId('aviso')).toHaveTextContent(
      'advertencia|Cliente guardado sin validar en Renaper.',
    );
  });

  it('el éxito invalida las listas de clientes', async () => {
    capturarAlta();
    const { usuario, queryClient } = montar();
    const invalidar = vi.spyOn(queryClient, 'invalidateQueries');
    await completar(usuario);
    await usuario.click(guardar());
    await screen.findByTestId('aviso');
    expect(invalidar).toHaveBeenCalledWith({ queryKey: ['clientes', 'lista'] });
  });

  it('durante el envío hay un solo POST con doble clic y los campos se deshabilitan', async () => {
    const pedidos: unknown[] = [];
    servidorMock.use(
      http.post('*/api/clientes', async () => {
        pedidos.push(1);
        await delay(100);
        return HttpResponse.json({ ...base, validadoRenaper: true }, { status: 201 });
      }),
    );
    const { usuario } = montar();
    await completar(usuario);
    await usuario.dblClick(guardar());
    await waitFor(() => expect(campo('DNI')).toBeDisabled());
    expect(guardar()).toHaveAttribute('aria-busy', 'true');
    await screen.findByTestId('aviso');
    expect(pedidos).toHaveLength(1);
  });
});

describe('AltaClientePage: errores del back', () => {
  const problema = (status: number, cuerpo: Record<string, unknown>) =>
    HttpResponse.json({ status, ...cuerpo }, { status });

  it('400 con errors.Dni marca el campo con aria-invalid y aria-describedby', async () => {
    capturarAlta(() => problema(400, { errors: { Dni: ['El DNI debe tener 8 dígitos.'] } }));
    const { usuario } = montar();
    await completar(usuario);
    await usuario.click(guardar());
    await waitFor(() => expect(campo('DNI')).toHaveAttribute('aria-invalid', 'true'));
    const ayuda = document.getElementById(campo('DNI').getAttribute('aria-describedby')!);
    expect(ayuda).toHaveTextContent('El DNI debe tener 8 dígitos.');
    await waitFor(() => expect(campo('DNI')).toHaveFocus());
    expect(campo('Nombre').value).toBe('Ana');
  });

  it('una clave con otra capitalización no rompe el mapeo', async () => {
    capturarAlta(() => problema(400, { errors: { CODIGOPOSTAL: ['El código es inválido.'] } }));
    const { usuario } = montar();
    await completar(usuario);
    await usuario.click(guardar());
    await waitFor(() => expect(campo('Código postal')).toHaveAttribute('aria-invalid', 'true'));
  });

  it('400 con detail de negocio va a un toast sin RNxx y no marca campos', async () => {
    capturarAlta(() =>
      problema(400, { detail: "RN01: Ya existe un cliente con el DNI '35874219'." }),
    );
    const { usuario } = montar();
    await completar(usuario);
    await usuario.click(guardar());
    expect(
      await screen.findByText("Ya existe un cliente con el DNI '35874219'."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/RN01/)).toBeNull();
    expect(campo('DNI')).not.toHaveAttribute('aria-invalid');
    expect(campo('Nombre').value).toBe('Ana');
  });

  it('los textos en inglés de errors no se muestran', async () => {
    capturarAlta(() => problema(400, { errors: { Nombre: ['The Nombre field is required.'] } }));
    const { usuario } = montar();
    await completar(usuario);
    await usuario.click(guardar());
    expect(await screen.findByText('Este campo es obligatorio.')).toBeInTheDocument();
    expect(screen.queryByText(/The Nombre field/)).toBeNull();
  });

  it('5xx muestra el aviso general y conserva los datos', async () => {
    capturarAlta(() => problema(500, { title: 'Error' }));
    const { usuario } = montar();
    await completar(usuario);
    await usuario.click(guardar());
    expect(
      await screen.findByText(
        'No pudimos guardar el cliente. Revisá los datos e intentá de nuevo.',
      ),
    ).toBeInTheDocument();
    expect(campo('Apellido').value).toBe('Gómez');
    expect(guardar()).toBeEnabled();
  });

  it('sin conexión muestra el aviso general', async () => {
    servidorMock.use(http.post('*/api/clientes', () => HttpResponse.error()));
    const { usuario } = montar();
    await completar(usuario);
    await usuario.click(guardar());
    expect(
      await screen.findByText(
        'No pudimos guardar el cliente. Revisá los datos e intentá de nuevo.',
      ),
    ).toBeInTheDocument();
  });
});

describe('AltaClientePage: cancelar', () => {
  it('sin cambios navega directo al listado', async () => {
    const { usuario, router } = montar();
    await usuario.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(router.state.location.pathname).toBe('/clientes');
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('con cambios abre el diálogo con foco en Seguir editando; Descartar navega', async () => {
    const { usuario, router } = montar();
    await usuario.type(campo('Nombre'), 'Ana');
    await usuario.click(screen.getByRole('button', { name: 'Cancelar' }));
    const dialogo = await screen.findByRole('alertdialog', {
      name: '¿Descartar los datos cargados?',
    });
    expect(within(dialogo).getByRole('button', { name: 'Seguir editando' })).toHaveFocus();
    await usuario.click(within(dialogo).getByRole('button', { name: 'Seguir editando' }));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(router.state.location.pathname).toBe('/clientes/nuevo');
    await usuario.click(screen.getByRole('button', { name: 'Cancelar' }));
    await usuario.click(await screen.findByRole('button', { name: 'Descartar' }));
    expect(router.state.location.pathname).toBe('/clientes');
  });
});
