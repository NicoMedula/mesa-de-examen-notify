import { Page, expect } from '@playwright/test';

export async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await expect(page).toHaveTitle(/Notificación de Mesas de Examen/);
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
  await page.waitForURL('**/departamento');
}

export async function loginAsDepartamento(page: Page) {
  await page.goto('/login');
  await expect(page).toHaveTitle(/Notificación de Mesas de Examen/);
  await page.locator('#email').fill('departamento@ejemplo.com');
  await page.locator('#password').fill('12345');
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
  await page.waitForURL('**/departamento');
}

export async function ensureMesaTable(page: Page) {
  const tabla = page.locator('table');
  await expect(tabla).toBeVisible({ timeout: 10000 });
}

export function mesaDataUnica() {
  const now = Date.now();
  return {
    materia: `MesaTest-${now}`,
    fecha: '2025-06-26',
    hora: '18:06',
    aula: '2'
  };
}

export async function createMesa(page: Page, mesaData: { materia: string; fecha: string; hora: string; aula: string; }) {
  await page.getByRole('button', { name: 'Nueva Mesa' }).click();
  await expect(page.locator('form')).toBeVisible();
  await page.locator('input[name="materia"]').fill(mesaData.materia);
  await page.locator('input[name="fecha"]').fill(mesaData.fecha);
  await page.locator('input[name="hora"]').fill(mesaData.hora);
  await page.locator('input[name="aula"]').fill(mesaData.aula);
  await page.locator('select[name="docente_titular"]').selectOption({ index: 1 });
  await page.locator('select[name="docente_vocal"]').selectOption({ index: 1 });
  await page.getByRole('button', { name: 'Guardar' }).click();
  // Esperar a que la fila aparezca
  const row = page.locator('tr', { has: page.getByText(mesaData.materia) });
  await expect(row).toBeVisible({ timeout: 15000 });
  return row;
}

export async function deleteMesa(page: Page, materia: string) {
  // Aceptar cualquier diálogo de confirmación
  page.on('dialog', dialog => dialog.accept());
  const row = page.locator('tr', { has: page.getByText(materia) });
  await expect(row).toBeVisible({ timeout: 15000 });
  await row.getByRole('button', { name: 'Eliminar' }).click();
  await expect(row).toHaveCount(0, { timeout: 20000 });
} 