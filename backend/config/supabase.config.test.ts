import { createSupabaseClient } from "./supabase";

describe("Configuración de Supabase", () => {
  const testUrl = "https://test.supabase.co";
  const testKey = "test-key";

  it("debería crear un cliente de Supabase correctamente", () => {
    const client = createSupabaseClient(testUrl, testKey);
    expect(client).toBeDefined();
  });

  it("debería tener la URL y la key configuradas", () => {
    const client = createSupabaseClient(testUrl, testKey);
    // @ts-ignore - Accediendo a propiedades internas para testing
    expect(client.supabaseUrl).toBe(testUrl);
    // @ts-ignore - Accediendo a propiedades internas para testing
    expect(client.supabaseKey).toBe(testKey);
  });
});
