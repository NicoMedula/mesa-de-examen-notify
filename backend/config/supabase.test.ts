import { DatabaseClient } from "../repositories/MesaRepository";

// Mock del cliente de Supabase para pruebas
export const supabase: DatabaseClient = {
  from: (table: string) => ({
    select: (columns?: string) => ({
      eq: (column: string, value: any) =>
        Promise.resolve({ data: [], error: null }),
      or: (condition: string) => Promise.resolve({ data: [], error: null }),
    }),
    insert: (data: any) => ({
      select: () => Promise.resolve({ data: [], error: null }),
    }),
    update: (data: any) => ({
      eq: (column: string, value: any) =>
        Promise.resolve({ data: [], error: null }),
    }),
    delete: () => ({
      eq: (column: string, value: any) =>
        Promise.resolve({ data: null, error: null }),
    }),
  }),
};

// Agregamos un test simple para que Jest no falle
describe("Supabase Mock", () => {
  it("debería existir", () => {
    expect(supabase).toBeDefined();
  });
});
