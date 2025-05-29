import { test, expect } from "@playwright/test";

test("Borrar una mesa de examen como departamento", async ({ page }) => {
  // Manejar confirmación nativa (window.confirm)
  page.on("dialog", (dialog) => dialog.accept());

  await page.goto("http://localhost:3000/login");
  await page.locator("#email").fill("departamento@ejemplo.com");
  await page.locator("#password").fill("12345");
  await page.getByRole("button", { name: "Iniciar Sesión" }).click();
  await page.waitForURL("**/departamento");

  // Buscar la fila de la mesa y hacer click en el botón Eliminar correspondiente
  const row = page.locator("tr", { hasText: "Matemática I" });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Eliminar" }).click();

  // Esperar a que la fila desaparezca del DOM
  await expect(row).toHaveCount(0, { timeout: 7000 });
});
