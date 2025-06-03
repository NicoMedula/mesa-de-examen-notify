import { test, expect } from "@playwright/test";

test("Crear una mesa de examen como departamento", async ({ page }) => {
  // Ir a la pantalla de login
  await page.goto("http://localhost:3000/login");

  // Verificar que estamos en la página correcta
  await expect(page).toHaveTitle(/Notificación de Mesas de Examen/);

  // Completar email y contraseña usando id
  await page.locator("#email").fill("departamento@ejemplo.com");
  await page.locator("#password").fill("12345");

  // Verificar que los campos se llenaron correctamente
  await expect(page.locator("#email")).toHaveValue("departamento@ejemplo.com");
  await expect(page.locator("#password")).toHaveValue("12345");

  // Click en Iniciar sesión (por texto exacto)
  await page.getByRole("button", { name: "Iniciar Sesión" }).click();

  // Esperar a que cargue el panel del departamento
  await page.waitForURL("**/departamento");

  // Click en "Nueva Mesa"
  await page.getByRole("button", { name: "Nueva Mesa" }).click();

  // Verificar que el formulario está visible
  await expect(page.locator("form")).toBeVisible();

  // Completar Materia/Cátedra por name
  await page.locator('input[name="materia"]').fill("Matemática I");
  await expect(page.locator('input[name="materia"]')).toHaveValue(
    "Matemática I"
  );

  // Completar Fecha (formato yyyy-mm-dd)
  await page.locator('input[name="fecha"]').fill("2025-06-10");
  await expect(page.locator('input[name="fecha"]')).toHaveValue("2025-06-10");

  // Completar Hora (formato HH:mm)
  await page.locator('input[name="hora"]').fill("10:00");
  await expect(page.locator('input[name="hora"]')).toHaveValue("10:00");

  // Completar Aula
  await page.locator('input[name="aula"]').fill("aula 12");
  await expect(page.locator('input[name="aula"]')).toHaveValue("aula 12");

  // Verificar que los selectores de docentes están presentes
  await expect(page.locator('select[name="docente_titular"]')).toBeVisible();
  await expect(page.locator('select[name="docente_vocal"]')).toBeVisible();

  // Seleccionar Docente Titular (elige el primero disponible que no sea vacío)
  await page
    .locator('select[name="docente_titular"]')
    .selectOption({ index: 1 });
  await expect(page.locator('select[name="docente_titular"]')).toHaveValue(/./);

  // Seleccionar Docente Vocal (elige el primero disponible que no sea vacío)
  await page.locator('select[name="docente_vocal"]').selectOption({ index: 1 });
  await expect(page.locator('select[name="docente_vocal"]')).toHaveValue(/./);

  // Guardar
  await page.getByRole("button", { name: "Guardar" }).click();

  // Esperar a que la mesa aparezca en la tabla (busca la fila exacta)
  const row = page.locator("tr", { has: page.getByText("Matemática I") });
  await expect(row).toBeVisible({ timeout: 10000 });
  await expect(row.getByText("2025-06-10")).toBeVisible();
  await expect(row.getByRole("cell", { name: "10:00" })).toBeVisible();
  await expect(row.getByRole("cell", { name: "aula 12" })).toBeVisible();

  // Verificar que el formulario se cerró
  await expect(page.locator("form")).not.toBeVisible();
});
