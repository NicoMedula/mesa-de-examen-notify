import { DatabaseClient } from "../repositories/MesaRepository";

// Mock del cliente de Supabase para pruebas.masc
export const supabase: DatabaseClient = {
  from: (table: string) => ({
    select: (columns?: string) => Promise.resolve({ data: [], error: null }),
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

  it("debería devolver promesas para todas las operaciones", async () => {
    const result = await supabase.from("test").select("*");
    expect(result).toEqual({ data: [], error: null });
  });
});
