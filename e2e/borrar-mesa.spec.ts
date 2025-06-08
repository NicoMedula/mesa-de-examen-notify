import { test, expect } from '@playwright/test';
import { loginAsDepartamento, createMesa, deleteMesa, ensureMesaTable, mesaDataUnica } from './utils';

test.describe('Mesas de Examen - Borrado', () => {
  test('Crear y borrar una mesa de examen única como departamento', async ({ page }) => {
    await loginAsDepartamento(page);
    await ensureMesaTable(page);
    const mesaData = mesaDataUnica();
    await createMesa(page, mesaData);
    await deleteMesa(page, mesaData.materia);
    // Verifica que la fila ya no existe
    const row = page.locator('tr', { has: page.getByText(mesaData.materia) });
    await expect(row).toHaveCount(0, { timeout: 10000 });
  });
});
