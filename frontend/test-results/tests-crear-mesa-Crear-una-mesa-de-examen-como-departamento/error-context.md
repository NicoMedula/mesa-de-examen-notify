# Test info

- Name: Crear una mesa de examen como departamento
- Location: /Users/nicolasmedula/Desktop/mesa-de-examen-notify/frontend/tests/crear-mesa.spec.ts:3:5

# Error details

```
Error: expect.toBeVisible: Error: strict mode violation: locator('td').filter({ hasText: '10:00' }) resolved to 2 elements:
    1) <td>…</td> aka getByRole('cell', { name: 'Matemática I' })
    2) <td class="d-none d-md-table-cell">10:00</td> aka getByRole('cell', { name: '10:' })

Call log:
  - expect.toBeVisible with timeout 5000ms
  - waiting for locator('td').filter({ hasText: '10:00' })

    at /Users/nicolasmedula/Desktop/mesa-de-examen-notify/frontend/tests/crear-mesa.spec.ts:46:58
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
    - row "Matemática I 2025-06-10T00:00:00+00:00 10:00 aula 12 Jose Fernandez pendiente Gilda Romero pendiente Editar Eliminar":
      - cell "Matemática I"
      - cell "2025-06-10T00:00:00+00:00"
      - cell "10:00"
      - cell "aula 12"
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
   3 | test("Crear una mesa de examen como departamento", async ({ page }) => {
   4 |   // Ir a la pantalla de login
   5 |   await page.goto("http://localhost:3000/login");
   6 |
   7 |   // Completar email y contraseña usando id
   8 |   await page.locator("#email").fill("departamento@ejemplo.com");
   9 |   await page.locator("#password").fill("12345");
  10 |
  11 |   // Click en Iniciar sesión (por texto exacto)
  12 |   await page.getByRole("button", { name: "Iniciar Sesión" }).click();
  13 |
  14 |   // Esperar a que cargue el panel del departamento
  15 |   await page.waitForURL("**/departamento");
  16 |
  17 |   // Click en "Nueva Mesa"
  18 |   await page.getByRole("button", { name: "Nueva Mesa" }).click();
  19 |
  20 |   // Completar Materia/Cátedra por name
  21 |   await page.locator('input[name="materia"]').fill("Matemática I");
  22 |
  23 |   // Completar Fecha (formato yyyy-mm-dd)
  24 |   await page.locator('input[name="fecha"]').fill("2025-06-10");
  25 |
  26 |   // Completar Hora (formato HH:mm)
  27 |   await page.locator('input[name="hora"]').fill("10:00");
  28 |
  29 |   // Completar Aula
  30 |   await page.locator('input[name="aula"]').fill("aula 12");
  31 |
  32 |   // Seleccionar Docente Titular (elige el primero disponible que no sea vacío)
  33 |   await page
  34 |     .locator('select[name="docente_titular"]')
  35 |     .selectOption({ index: 1 });
  36 |
  37 |   // Seleccionar Docente Vocal (elige el primero disponible que no sea vacío)
  38 |   await page.locator('select[name="docente_vocal"]').selectOption({ index: 1 });
  39 |
  40 |   // Guardar
  41 |   await page.getByRole("button", { name: "Guardar" }).click();
  42 |
  43 |   // Verificar que la mesa aparece en la lista
  44 |   await expect(page.getByText("Matemática I")).toBeVisible();
  45 |   await expect(page.getByText("2025-06-10")).toBeVisible();
> 46 |   await expect(page.locator("td", { hasText: "10:00" })).toBeVisible();
     |                                                          ^ Error: expect.toBeVisible: Error: strict mode violation: locator('td').filter({ hasText: '10:00' }) resolved to 2 elements:
  47 |   await expect(page.getByText("aula 12")).toBeVisible();
  48 | });
  49 |
```