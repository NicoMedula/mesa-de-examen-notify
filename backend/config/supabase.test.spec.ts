import { supabase } from "./supabase.test";

describe("Supabase Mock", () => {
  it("debería proporcionar un mock funcional para operaciones de base de datos", async () => {
    // Verificar que el mock de from funciona.
    const fromResult = supabase.from("test-table");
    expect(fromResult).toBeDefined();

    // Verificar que el mock de select funciona.
    const selectResult = await fromResult.select("*");
    expect(selectResult).toBeDefined();
    expect(selectResult.data).toEqual([]);
    expect(selectResult.error).toBeNull();

    // Verificar que el mock de insert funciona
    const insertResult = await fromResult.insert({ test: "data" });
    expect(insertResult).toBeDefined();
    expect(insertResult.data).toEqual([]);
    expect(insertResult.error).toBeNull();

    // Verificar que el mock de update funciona
    const updateResult = await fromResult.update({ test: "updated" });
    expect(updateResult).toBeDefined();
    expect(updateResult.data).toEqual([]);
    expect(updateResult.error).toBeNull();

    // Verificar que el mock de delete funciona
    const deleteResult = await fromResult.delete();
    expect(deleteResult).toBeDefined();
    expect(deleteResult.data).toBeNull();
    expect(deleteResult.error).toBeNull();
  });
});
