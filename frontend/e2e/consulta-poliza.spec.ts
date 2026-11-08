import { expect, test } from '@playwright/test';

test.use({ baseURL: 'http://localhost:5174' });

test('consultar una póliza válida muestra sus datos en /poliza', async ({ page }) => {
  await page.goto('/consultar-poliza');

  await page.getByLabel('DNI').fill('30123456');
  await page.getByLabel('Número de póliza').fill('POL-0000001');
  await page.getByRole('button', { name: 'Consultar' }).click();

  await expect(page).toHaveURL(/\/poliza$/);
  await expect(page.getByText('POL-0000001').first()).toBeVisible();
});
