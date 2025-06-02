import { test, expect } from "@playwright/test";

test("Crear una mesa de examen como departamento", async ({ page }) => {
  // Ir a la pantalla de login
  await page.goto("http://localhost:3000/login");

  // Completar email y contraseña usando id
  await page.locator("#email").fill("departamento@ejemplo.com");
  await page.locator("#password").fill("12345");

  // Click en Iniciar sesión (por texto exacto)
  await page.getByRole("button", { name: "Iniciar Sesión" }).click();

  // Esperar a que cargue el panel del departamento
  await page.waitForURL("**/departamento");

  // Click en "Nueva Mesa"
  await page.getByRole("button", { name: "Nueva Mesa" }).click();

  // Completar Materia/Cátedra por name
  await page.locator('input[name="materia"]').fill("Matemática I");

  // Completar Fecha (formato yyyy-mm-dd)
  await page.locator('input[name="fecha"]').fill("2025-06-10");

  // Completar Hora (formato HH:mm)
  await page.locator('input[name="hora"]').fill("10:00");

  // Completar Aula
  await page.locator('input[name="aula"]').fill("aula 12");

  // Seleccionar Docente Titular (elige el primero disponible que no sea vacío)
  await page
    .locator('select[name="docente_titular"]')
    .selectOption({ index: 1 });

  // Seleccionar Docente Vocal (elige el primero disponible que no sea vacío)
  await page.locator('select[name="docente_vocal"]').selectOption({ index: 1 });

  // Guardar
  await page.getByRole("button", { name: "Guardar" }).click();

  // Verificar que la mesa aparece en la lista
  await expect(page.getByText("Matemática I")).toBeVisible();
  await expect(page.getByText("2025-06-10")).toBeVisible();
  await expect(page.getByText("10:00")).toBeVisible();
  await expect(page.getByText("aula 12")).toBeVisible();
});
