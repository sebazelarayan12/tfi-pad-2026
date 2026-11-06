import { ApiClientProvider, createApiClient, type CrearUsuarioRequest } from '@nexa/api';
import { servidorMock } from '@nexa/api/mocks/server';
import { expectSinViolacionesA11y } from '@nexa/ui/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { NuevoEmpleadoPanel } from './NuevoEmpleadoPanel';

const alta = '*/api/auth/usuarios';
// Contraseña ficticia solo para estos tests.
const PASSWORD_PRUEBA = 'Prueba-Ficticia-1';

function problema(status: number, cuerpo: Record<string, unknown>) {
  return HttpResponse.json(
    { status, title: 'Error', ...cuerpo },
    { status, headers: { 'Content-Type': 'application/problem+json' } },
  );
}

function capturarAlta(respuesta?: () => Response | Promise<Response>) {
  const capturas: CrearUsuarioRequest[] = [];
  servidorMock.use(
    http.post(alta, async ({ request }) => {
      capturas.push((await request.json()) as CrearUsuarioRequest);
      return (
        respuesta?.() ??
        HttpResponse.json({ id: 'u-1', email: 'julieta@example.test', rol: 'Empleado' }, { status: 201 })
      );
    }),
  );
  return capturas;
}

function montar() {
  const usuario = userEvent.setup();
  const cliente = createApiClient({ baseUrl: 'https://api.test' });
  const vista = render(
    <QueryClientProvider client={new QueryClient()}>
      <ApiClientProvider client={cliente}>
        <NuevoEmpleadoPanel />
      </ApiClientProvider>
    </QueryClientProvider>,
  );
  return { usuario, ...vista };
}

const campo = (nombre: string) => screen.getByLabelText(nombre) as HTMLInputElement;

async function completar(usuario: ReturnType<typeof userEvent.setup>, password = PASSWORD_PRUEBA) {
  await usuario.type(campo('Nombre'), 'Julieta');
  await usuario.type(campo('Apellido'), 'Ávila');
  await usuario.type(campo('Email'), 'julieta@example.test');
  await usuario.type(campo('Contraseña temporal'), password);
  await usuario.click(screen.getByRole('radio', { name: 'Empleado' }));
}

const crear = () => screen.getByRole('button', { name: /Crear empleado|Creando usuario/ });

afterEach(() => vi.restoreAllMocks());

describe('NuevoEmpleadoPanel', () => {
  it('muestra_textos_literales_del_figma', () => {
    montar();
    expect(screen.getByRole('heading', { name: 'Nuevo empleado' })).toBeInTheDocument();
    ['Nombre', 'Apellido', 'Email', 'Contraseña temporal'].forEach((etiqueta) =>
      expect(campo(etiqueta)).toBeInTheDocument(),
    );
    expect(screen.getByText('Compartila por un canal seguro.')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Empleado' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Administrador' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
    expect(crear()).toHaveTextContent('Crear empleado');
  });

  it('rol_sin_preseleccion', () => {
    montar();
    screen.getAllByRole('radio').forEach((radio) => expect(radio).not.toBeChecked());
  });

  it('envio_vacio_muestra_errores_y_no_llama_a_la_api', async () => {
    const capturas = capturarAlta();
    const { usuario } = montar();
    await usuario.click(crear());
    expect(await screen.findByText('El nombre es obligatorio.')).toBeInTheDocument();
    expect(screen.getByText('El rol es obligatorio.')).toBeInTheDocument();
    expect(capturas).toHaveLength(0);
  });

  it('envia_body_con_los_cinco_campos', async () => {
    const capturas = capturarAlta();
    const { usuario } = montar();
    await completar(usuario);
    await usuario.click(crear());
    await waitFor(() => expect(capturas).toHaveLength(1));
    expect(capturas[0]).toEqual({
      nombre: 'Julieta',
      apellido: 'Ávila',
      email: 'julieta@example.test',
      password: PASSWORD_PRUEBA,
      rol: 'Empleado',
    });
  });

  it('no_recorta_la_password_al_enviar', async () => {
    const capturas = capturarAlta();
    const { usuario } = montar();
    await completar(usuario, '  Prueba-1  ');
    await usuario.click(crear());
    await waitFor(() => expect(capturas).toHaveLength(1));
    expect(capturas[0]?.password).toBe('  Prueba-1  ');
  });

  it('201_limpia_formulario_y_borra_password', async () => {
    capturarAlta();
    const { usuario } = montar();
    await completar(usuario);
    await usuario.click(crear());
    expect(await screen.findByText('Usuario creado.')).toBeInTheDocument();
    expect(campo('Contraseña temporal').value).toBe('');
    expect(campo('Nombre').value).toBe('');
    screen.getAllByRole('radio').forEach((radio) => expect(radio).not.toBeChecked());
    expect(campo('Nombre')).toHaveFocus();
  });

  it('400_errors_muestra_texto_en_espanol_bajo_el_campo', async () => {
    capturarAlta(() => problema(400, { errors: { Email: ['Email is invalid.'] } }));
    const { usuario } = montar();
    await completar(usuario);
    await usuario.click(crear());
    expect(await screen.findByText('El email no tiene un formato válido.')).toBeInTheDocument();
    expect(screen.queryByText('Email is invalid.')).not.toBeInTheDocument();
    expect(campo('Email')).toHaveAttribute('aria-invalid', 'true');
  });

  it('400_detail_email_repetido_en_alerta_sin_marcar_campo', async () => {
    capturarAlta(() => problema(400, { detail: 'El email ya está registrado.' }));
    const { usuario } = montar();
    await completar(usuario);
    await usuario.click(crear());
    expect(await screen.findByRole('alert')).toHaveTextContent('El email ya está registrado.');
    expect(campo('Email')).not.toHaveAttribute('aria-invalid');
  });

  it('400_detail_identity_muestra_texto_completo', async () => {
    const texto =
      'La contraseña debe tener al menos 12 caracteres. La contraseña debe incluir al menos un símbolo.';
    capturarAlta(() => problema(400, { detail: texto }));
    const { usuario } = montar();
    await completar(usuario);
    await usuario.click(crear());
    expect(await screen.findByRole('alert')).toHaveTextContent(texto);
    expect(campo('Contraseña temporal').value).toBe(PASSWORD_PRUEBA);
  });

  it('403_muestra_texto_propio', async () => {
    capturarAlta(() => new HttpResponse(null, { status: 403 }));
    const { usuario } = montar();
    await completar(usuario);
    await usuario.click(crear());
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No tenés permiso para crear usuarios.',
    );
  });

  it('500_sin_detail_muestra_error_inesperado', async () => {
    capturarAlta(() => new HttpResponse(null, { status: 500 }));
    const { usuario } = montar();
    await completar(usuario);
    await usuario.click(crear());
    expect(await screen.findByRole('alert')).toHaveTextContent('Ocurrió un error inesperado.');
  });

  it('doble_clic_envia_un_post', async () => {
    const capturas = capturarAlta(async () => {
      await delay(50);
      return HttpResponse.json({ id: 'u-1', email: 'julieta@example.test', rol: 'Empleado' }, { status: 201 });
    });
    const { usuario } = montar();
    await completar(usuario);
    await usuario.dblClick(crear());
    await screen.findByText('Usuario creado.');
    expect(capturas).toHaveLength(1);
  });

  it('error_de_red_no_reenvia', async () => {
    const capturas: unknown[] = [];
    servidorMock.use(
      http.post(alta, () => {
        capturas.push(1);
        return HttpResponse.error();
      }),
    );
    const { usuario } = montar();
    await completar(usuario);
    await usuario.click(crear());
    expect(await screen.findByRole('alert')).toHaveTextContent('Ocurrió un error inesperado.');
    expect(capturas).toHaveLength(1);
  });

  it('generar_llena_el_campo_con_una_password_valida', async () => {
    const capturas = capturarAlta();
    const { usuario } = montar();
    expect(campo('Contraseña temporal').value).toBe('');
    await usuario.click(screen.getByRole('button', { name: 'Generar contraseña temporal' }));
    const generada = campo('Contraseña temporal');
    expect(generada.value).toHaveLength(16);
    expect(generada).toHaveAttribute('type', 'text');

    await usuario.type(campo('Nombre'), 'Julieta');
    await usuario.type(campo('Apellido'), 'Ávila');
    await usuario.type(campo('Email'), 'julieta@example.test');
    await usuario.click(screen.getByRole('radio', { name: 'Administrador' }));
    const esperada = generada.value;
    await usuario.click(crear());
    await waitFor(() => expect(capturas).toHaveLength(1));
    expect(capturas[0]?.password).toBe(esperada);
  });

  it('copiar_envia_la_password_al_portapapeles', async () => {
    const { usuario } = montar();
    const copiar = screen.getByRole('button', { name: 'Copiar contraseña temporal' });
    expect(copiar).toBeDisabled();
    const escribir = vi.spyOn(navigator.clipboard, 'writeText');
    await usuario.click(screen.getByRole('button', { name: 'Generar contraseña temporal' }));
    const generada = campo('Contraseña temporal').value;
    await usuario.click(copiar);
    expect(escribir).toHaveBeenCalledWith(generada);
    expect(await screen.findByText('Contraseña copiada.')).toBeInTheDocument();
  });

  it('copiar_con_portapapeles_rechazado_muestra_aviso', async () => {
    const { usuario } = montar();
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denegado'));
    await usuario.click(screen.getByRole('button', { name: 'Generar contraseña temporal' }));
    const generada = campo('Contraseña temporal').value;
    await usuario.click(screen.getByRole('button', { name: 'Copiar contraseña temporal' }));
    expect(await screen.findByText('No se pudo copiar. Copiala a mano.')).toBeInTheDocument();
    expect(campo('Contraseña temporal').value).toBe(generada);
  });

  it('mostrar_ocultar_cambia_type_y_aria_label', async () => {
    const { usuario } = montar();
    expect(campo('Contraseña temporal')).toHaveAttribute('type', 'password');
    await usuario.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(campo('Contraseña temporal')).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Ocultar contraseña' })).toBeInTheDocument();
  });

  it('cancelar_limpia_el_formulario', async () => {
    const { usuario } = montar();
    await completar(usuario);
    await usuario.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(campo('Nombre').value).toBe('');
    expect(campo('Contraseña temporal').value).toBe('');
    screen.getAllByRole('radio').forEach((radio) => expect(radio).not.toBeChecked());
  });

  it('password_no_se_guarda_en_storage', async () => {
    capturarAlta();
    const sesion = vi.spyOn(Storage.prototype, 'setItem');
    const { usuario } = montar();
    await usuario.click(screen.getByRole('button', { name: 'Generar contraseña temporal' }));
    const generada = campo('Contraseña temporal').value;
    await usuario.type(campo('Nombre'), 'Julieta');
    await usuario.type(campo('Apellido'), 'Ávila');
    await usuario.type(campo('Email'), 'julieta@example.test');
    await usuario.click(screen.getByRole('radio', { name: 'Empleado' }));
    await usuario.click(crear());
    await screen.findByText('Usuario creado.');
    sesion.mock.calls.forEach(([, valor]) => expect(String(valor)).not.toContain(generada));
  });

  it('a11y_sin_violaciones', async () => {
    const { container } = montar();
    await expectSinViolacionesA11y(container);
  });
});
