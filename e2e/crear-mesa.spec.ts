import { test, expect } from '@playwright/test';
import { loginAsDepartamento, createMesa, ensureMesaTable, mesaDataUnica } from './utils';

test.describe('Mesas de Examen - Flujo Completo', () => {
  test('Solo login y tabla visible', async ({ page }) => {
    await loginAsDepartamento(page);
    await ensureMesaTable(page);
  });

  test('Crear una mesa de examen única como departamento', async ({ page }) => {
    await loginAsDepartamento(page);
    await ensureMesaTable(page);
    const mesaData = mesaDataUnica();
    const row = await createMesa(page, mesaData);
    await expect(row).toContainText(mesaData.materia);
    await expect(row).toContainText(mesaData.fecha);
    await expect(row).toContainText(mesaData.hora);
    await expect(row).toContainText(mesaData.aula);
    await expect(page.locator('form')).not.toBeVisible();
  });
});
