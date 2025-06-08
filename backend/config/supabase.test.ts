import { supabase } from "./supabase";

// Mock de Supabase
const mockFrom = jest.fn(() => ({
  select: jest.fn(() => ({
    eq: jest.fn(() => ({
      data: jest.fn().mockResolvedValue({ data: [], error: null }),
      error: jest.fn().mockResolvedValue({ data: null, error: new Error("Test error") })
    })
  })),
  insert: jest.fn(() => ({
    data: jest.fn().mockResolvedValue({ data: [], error: null })
  })),
  update: jest.fn(() => ({
    eq: jest.fn(() => ({
      data: jest.fn().mockResolvedValue({ data: [], error: null })
    }))
  })),
  delete: jest.fn(() => ({
    eq: jest.fn(() => ({
      data: jest.fn().mockResolvedValue({ data: [], error: null })
    }))
  }))
}));

const supabase = { from: mockFrom };

jest.mock("./supabase", () => ({ supabase }));

describe("Supabase", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("debería seleccionar datos", async () => {
    const result = await supabase.from("mesas").select().eq("id", "1").data();
    expect(result).toEqual({ data: [], error: null });
    expect(supabase.from).toHaveBeenCalledWith("mesas");
  });

  it("debería insertar datos", async () => {
    const newMesa = { materia: "Matemática I", fecha: "2024-03-20", hora: "14:00" };
    const result = await supabase.from("mesas").insert(newMesa).data();
    expect(result).toEqual({ data: [], error: null });
    expect(supabase.from).toHaveBeenCalledWith("mesas");
  });

  it("debería actualizar datos", async () => {
    const updateData = { aula: "Aula 102" };
    const result = await supabase.from("mesas").update(updateData).eq("id", "1").data();
    expect(result).toEqual({ data: [], error: null });
    expect(supabase.from).toHaveBeenCalledWith("mesas");
  });

  it("debería eliminar datos", async () => {
    const result = await supabase.from("mesas").delete().eq("id", "1").data();
    expect(result).toEqual({ data: [], error: null });
    expect(supabase.from).toHaveBeenCalledWith("mesas");
  });

  it("debería manejar errores", async () => {
    const result = await supabase.from("mesas").select().eq("id", "1").error();
    expect(result).toEqual({ data: null, error: new Error("Test error") });
  });
});

export { supabase };
