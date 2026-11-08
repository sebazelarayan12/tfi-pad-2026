import { expect, test } from '@playwright/test';

import { usuarioMockCambioPendiente } from '@nexa/api/mocks/handlers/auth';

test.use({ baseURL: 'http://localhost:5173' });

// Contraseña ficticia que cumple la política (12+, mayúscula, minúscula, número y símbolo).
// Solo existe en el MSW del navegador: no es una credencial real.
const PASSWORD_NUEVA = 'Nueva-Mock-2026!';

test('ingresar con credenciales válidas lleva a /inicio', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel('Email').fill(usuarioMockCambioPendiente.email);
  await page
    .getByLabel('Contraseña', { exact: true })
    .fill(usuarioMockCambioPendiente.passwordTemporal);
  await page.getByRole('button', { name: 'Ingresar' }).click();

  // El usuario de prueba de MSW tiene el cambio de contraseña pendiente (US-FE-B-26): hay que
  // completarlo antes de llegar a /inicio.
  await expect(page).toHaveURL(/\/cambiar-password$/);
  await page.getByLabel('Contraseña temporal').fill(usuarioMockCambioPendiente.passwordTemporal);
  await page.getByLabel('Contraseña nueva', { exact: true }).fill(PASSWORD_NUEVA);
  await page.getByLabel('Repetir contraseña nueva').fill(PASSWORD_NUEVA);
  await page.getByRole('button', { name: 'Cambiar contraseña' }).click();

  await expect(page).toHaveURL(/\/inicio$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
