import { test, expect } from "@playwright/test";

test("Borrar una mesa de examen como departamento", async ({ page }) => {
  // Manejar confirmación nativa (window.confirm)
  page.on("dialog", (dialog) => dialog.accept());

  await page.goto("http://localhost:3000/login");

  // Verificar que estamos en la página correcta
  await expect(page).toHaveTitle(/Notificación de Mesas de Examen/);

  await page.locator("#email").fill("departamento@ejemplo.com");
  await page.locator("#password").fill("12345");

  // Verificar que los campos se llenaron correctamente
  await expect(page.locator("#email")).toHaveValue("departamento@ejemplo.com");
  await expect(page.locator("#password")).toHaveValue("12345");

  await page.getByRole("button", { name: "Iniciar Sesión" }).click();

  // Esperar a que cargue el panel del departamento
  await page.waitForURL("**/departamento");

  // Buscar la fila de la mesa y hacer click en el botón Eliminar correspondiente
  const row = page.locator("tr", { has: page.getByText("Matemática I") });
  await expect(row).toBeVisible({ timeout: 10000 });
  await row.getByRole("button", { name: "Eliminar" }).click();

  // Esperar a que la fila desaparezca del DOM
  await expect(row).toHaveCount(0, { timeout: 10000 });

  // Verificar que no hay mensajes de error
  await expect(page.locator(".error-message")).not.toBeVisible();
});
