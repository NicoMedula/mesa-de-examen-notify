# Test info

- Name: Borrar una mesa de examen como departamento
- Location: /Users/nicolasmedula/Desktop/mesa-de-examen-notify/frontend/tests/borrar-mesa.spec.ts:3:5

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toBeVisible()

Locator: locator('tr').filter({ hasText: 'Matemática I' })
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 5000ms
  - waiting for locator('tr').filter({ hasText: 'Matemática I' })

    at /Users/nicolasmedula/Desktop/mesa-de-examen-notify/frontend/tests/borrar-mesa.spec.ts:15:21
```

# Page snapshot

```yaml
- heading "Panel del Departamento - Gestión de Mesas de Examen" [level=2]
- button "Cerrar sesión"
- button "Nueva Mesa"
- list:
  - listitem:
    - button "Mesas Pendientes"
  - listitem:
    - button "Mesas Confirmadas"
  - listitem:
    - button "Docentes Registrados"
  - listitem:
    - button "Historial de Mesas"
- table:
  - rowgroup:
    - row "Materia Fecha Hora Aula Docente Titular Docente Vocal Acciones":
      - cell "Materia"
      - cell "Fecha"
      - cell "Hora"
      - cell "Aula"
      - cell "Docente Titular"
      - cell "Docente Vocal"
      - cell "Acciones"
  - rowgroup:
    - row "eewe 2025-06-07T00:00:00+00:00 13:31 12 Jose Fernandez pendiente Gilda Romero pendiente Editar Eliminar":
      - cell "eewe"
      - cell "2025-06-07T00:00:00+00:00"
      - cell "13:31"
      - cell "12"
      - cell "Jose Fernandez pendiente"
      - cell "Gilda Romero pendiente"
      - cell "Editar Eliminar":
        - button "Editar"
        - button "Eliminar"
```

# Test source

```ts
   1 | import { test, expect } from "@playwright/test";
   2 |
   3 | test("Borrar una mesa de examen como departamento", async ({ page }) => {
   4 |   // Manejar confirmación nativa (window.confirm)
   5 |   page.on("dialog", (dialog) => dialog.accept());
   6 |
   7 |   await page.goto("http://localhost:3000/login");
   8 |   await page.locator("#email").fill("departamento@ejemplo.com");
   9 |   await page.locator("#password").fill("12345");
  10 |   await page.getByRole("button", { name: "Iniciar Sesión" }).click();
  11 |   await page.waitForURL("**/departamento");
  12 |
  13 |   // Buscar la fila de la mesa y hacer click en el botón Eliminar correspondiente
  14 |   const row = page.locator("tr", { hasText: "Matemática I" });
> 15 |   await expect(row).toBeVisible();
     |                     ^ Error: Timed out 5000ms waiting for expect(locator).toBeVisible()
  16 |   await row.getByRole("button", { name: "Eliminar" }).click();
  17 |
  18 |   // Esperar a que la fila desaparezca del DOM
  19 |   await expect(row).toHaveCount(0, { timeout: 7000 });
  20 | });
  21 |
```