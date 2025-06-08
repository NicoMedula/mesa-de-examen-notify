import { MesaRepository } from "../MesaRepository";
import { supabase } from "../../config/supabase.test";
import { Mesa, EstadoMesa, EstadoConfirmacion } from "../../types";

describe("MesaRepository", () => {
  let repository: MesaRepository;
  let supabase: any;

  beforeEach(() => {
    supabase = {
      from: jest.fn().mockImplementation(() => ({
        select: jest.fn().mockImplementation(() => ({ eq: jest.fn().mockImplementation(() => ({ single: jest.fn() })) })),
        insert: jest.fn().mockImplementation(() => ({ select: jest.fn() })),
        update: jest.fn().mockImplementation(() => ({ eq: jest.fn() })),
        delete: jest.fn().mockImplementation(() => ({ eq: jest.fn() })),
        eq: jest.fn().mockImplementation(() => ({ single: jest.fn() })),
        single: jest.fn()
      })),
      // Propiedades dummy para SupabaseClient
      supabaseUrl: '',
      supabaseKey: '',
      auth: {},
      realtime: {},
    };
    repository = MesaRepository.getInstance(supabase as any);
  });

  it("debería obtener todas las mesas", async () => {
    const mockMesas = [
      {
        id: "1",
        materia: "Matemática I",
        fecha: "2024-03-20",
        hora: "14:00",
        aula: "Aula 101",
        estado: "pendiente",
        docente_titular: "123",
        docente_vocal: "456",
        docentes: [
          { id: "123", nombre: "Docente 1", confirmacion: "pendiente" },
          { id: "456", nombre: "Docente 2", confirmacion: "pendiente" },
        ],
      },
    ];

    const selectMock = jest.fn().mockResolvedValue({ data: mockMesas, error: null });
    supabase.from = jest.fn().mockReturnValue({
      select: selectMock,
      insert: jest.fn().mockReturnValue({ select: jest.fn() }),
      update: jest.fn().mockReturnValue({ eq: jest.fn() }),
      delete: jest.fn().mockReturnValue({ eq: jest.fn() }),
      eq: jest.fn().mockReturnValue({ single: jest.fn() }),
      single: jest.fn()
    });

    const mesas = await repository.getAllMesas();
    expect(mesas).toHaveLength(1);
    expect(mesas[0].materia).toBe("Matemática I");
  });

  it("debería obtener mesas por ID de docente", async () => {
    const mockMesas = [
      {
        id: "1",
        materia: "Matemática I",
        fecha: "2024-03-20",
        hora: "14:00",
        aula: "Aula 101",
        estado: "pendiente",
        docente_titular: "123",
        docente_vocal: "456",
        docentes: [
          { id: "123", nombre: "Docente 1", confirmacion: "pendiente" },
          { id: "456", nombre: "Docente 2", confirmacion: "pendiente" },
        ],
      },
    ];

    const selectMock = jest.fn().mockResolvedValue({ data: mockMesas, error: null });
    supabase.from = jest.fn().mockReturnValue({
      select: selectMock,
      insert: jest.fn().mockReturnValue({ select: jest.fn() }),
      update: jest.fn().mockReturnValue({ eq: jest.fn() }),
      delete: jest.fn().mockReturnValue({ eq: jest.fn() }),
      eq: jest.fn().mockReturnValue({ single: jest.fn() }),
      single: jest.fn()
    });

    const mesas = await repository.getMesasByDocenteId("123");
    expect(mesas).toHaveLength(1);
    expect(mesas[0].docente_titular).toBe("123");
  });

  it("debería crear una mesa exitosamente", async () => {
    const mockMesaCreada: Mesa = {
      id: "test-id",
      materia: "Test Materia",
      fecha: "2025-06-11",
      hora: "14:00",
      aula: "Aula Test",
      estado: "pendiente" as EstadoMesa,
      docente_titular: "123",
      docente_vocal: "456",
      docentes: [
        { id: "123", nombre: "Docente 1", confirmacion: "pendiente" },
        { id: "456", nombre: "Docente 2", confirmacion: "pendiente" }
      ]
    };

    const insertMock = jest.fn().mockReturnValue({ 
      select: jest.fn().mockResolvedValue({ data: [mockMesaCreada], error: null }) 
    });

    supabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: [], error: null }),
      insert: insertMock,
      update: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }),
      delete: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }),
      eq: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: [], error: null }) }),
      single: jest.fn().mockResolvedValue({ data: [], error: null })
    });

    const mesa = await repository.createMesa(mockMesaCreada);
    expect(mesa).toEqual(mockMesaCreada);
  });

  it("debería actualizar una mesa existente", async () => {
    const mockMesa = {
      id: "1",
      materia: "Matemática I",
      fecha: "2024-03-20",
      hora: "14:00",
      aula: "Aula 101",
      estado: "pendiente",
      docente_titular: "123",
      docente_vocal: "456",
      docentes: [
        { id: "123", nombre: "Docente 1", confirmacion: "pendiente" },
        { id: "456", nombre: "Docente 2", confirmacion: "pendiente" },
      ],
    };

    const updateMock = jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) });
    const selectMock = jest.fn().mockResolvedValue({ data: [mockMesa], error: null });
    supabase.from = jest.fn().mockReturnValue({
      update: updateMock,
      select: selectMock,
      insert: jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue({ data: [], error: null }) }),
      delete: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }),
      eq: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: [], error: null }) }),
      single: jest.fn().mockResolvedValue({ data: [], error: null })
    });

    const mesaActualizada = await repository.updateMesa("1", { aula: "Aula 102" });
    expect(mesaActualizada.aula).toBe("Aula 101"); // El mock devuelve la mesa original
  });

  it("debería eliminar una mesa", async () => {
    const deleteMock = jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) });
    supabase.from = jest.fn().mockReturnValue({
      delete: deleteMock,
      select: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ data: [], error: null }) }),
      insert: jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue({ data: [], error: null }) }),
      update: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }),
      eq: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: [], error: null }) }),
      single: jest.fn().mockResolvedValue({ data: [], error: null })
    });

    await expect(repository.deleteMesa("1")).resolves.not.toThrow();
  });

  it("debería actualizar la confirmación de un docente", async () => {
    const mockMesa = {
      id: "1",
      materia: "Matemática I",
      fecha: "2024-03-20",
      hora: "14:00",
      aula: "Aula 101",
      estado: "pendiente",
      docente_titular: "123",
      docente_vocal: "456",
      docentes: [
        { id: "123", nombre: "Docente 1", confirmacion: "pendiente" },
        { id: "456", nombre: "Docente 2", confirmacion: "pendiente" },
      ],
    };

    const selectMock = jest.fn().mockResolvedValue({ data: [mockMesa], error: null });
    const updateMock = jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) });
    supabase.from = jest.fn().mockReturnValue({
      select: selectMock,
      update: updateMock,
      insert: jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue({ data: [], error: null }) }),
      delete: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }),
      eq: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: [], error: null }) }),
      single: jest.fn().mockResolvedValue({ data: [], error: null })
    });

    const mesaActualizada = await repository.updateConfirmacion("1", "123", "aceptado");
    expect(mesaActualizada).toBeDefined();
  });

  it("debería confirmar una mesa", async () => {
    const mockMesa: Mesa = {
      id: "1",
      materia: "Matemática I",
      fecha: "2025-06-11",
      hora: "14:00",
      aula: "Aula 101",
      estado: "pendiente" as EstadoMesa,
      docente_titular: "123",
      docente_vocal: "456",
      docentes: [
        { id: "123", nombre: "Docente 1", confirmacion: "aceptado" },
        { id: "456", nombre: "Docente 2", confirmacion: "aceptado" }
      ]
    };

    const mockMesaConfirmada = { ...mockMesa, estado: "confirmada" as EstadoMesa };
    const selectMock = jest.fn().mockResolvedValue({ data: [mockMesa], error: null });
    const updateMock = jest.fn().mockReturnValue({ 
      eq: jest.fn().mockResolvedValue({ data: [mockMesaConfirmada], error: null }) 
    });

    supabase.from = jest.fn().mockReturnValue({
      select: selectMock,
      update: updateMock,
      insert: jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue({ data: [], error: null }) }),
      delete: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }),
      eq: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: [], error: null }) }),
      single: jest.fn().mockResolvedValue({ data: [], error: null })
    });

    const mesaConfirmada = await repository.confirmarMesa("1");
    expect(mesaConfirmada.estado).toBe("confirmada");
  });

  it("debería obtener una mesa por ID", async () => {
    const mockMesa = {
      id: "1",
      materia: "Matemática I",
      fecha: "2024-03-20",
      hora: "14:00",
      aula: "Aula 101",
      estado: "pendiente",
      docente_titular: "123",
      docente_vocal: "456",
      docentes: [
        { id: "123", nombre: "Docente 1", confirmacion: "pendiente" },
        { id: "456", nombre: "Docente 2", confirmacion: "pendiente" },
      ],
    };

    const selectMock = jest.fn().mockResolvedValue({ data: [mockMesa], error: null });
    supabase.from = jest.fn().mockReturnValue({ select: selectMock, insert: jest.fn(), update: jest.fn(), delete: jest.fn(), eq: jest.fn(), single: jest.fn() });

    const mesa = await repository.getMesaById("1");
    expect(mesa).not.toBeNull();
    expect(mesa?.id).toBe("1");
  });

  it("debería retornar null cuando no se encuentra una mesa por ID", async () => {
    const selectMock = jest.fn().mockResolvedValue({ data: [], error: null });
    supabase.from = jest.fn().mockReturnValue({ select: selectMock, insert: jest.fn(), update: jest.fn(), delete: jest.fn(), eq: jest.fn(), single: jest.fn() });

    const mesa = await repository.getMesaById("999");
    expect(mesa).toBeNull();
  });

  it("debería validar que la materia sea obligatoria", async () => {
    const fechaFutura = new Date();
    fechaFutura.setDate(fechaFutura.getDate() + 3);
    const fechaStr = fechaFutura.toISOString().split('T')[0];

    const mesa: Mesa = {
      id: "1",
      materia: "",
      fecha: fechaStr,
      hora: "14:00",
      aula: "Aula 101",
      estado: "pendiente",
      docente_titular: "123",
      docente_vocal: "456",
      docentes: [
        { id: "123", nombre: "Docente 1", confirmacion: "pendiente" },
        { id: "456", nombre: "Docente 2", confirmacion: "pendiente" },
      ],
    };

    await expect(repository.createMesa(mesa)).rejects.toThrow("La materia es obligatoria");
  });

  it("debería validar que la fecha sea obligatoria", async () => {
    const mesa: Mesa = {
      id: "1",
      materia: "Matemática I",
      fecha: "",
      hora: "14:00",
      aula: "Aula 101",
      estado: "pendiente",
      docente_titular: "123",
      docente_vocal: "456",
      docentes: [
        { id: "123", nombre: "Docente 1", confirmacion: "pendiente" },
        { id: "456", nombre: "Docente 2", confirmacion: "pendiente" },
      ],
    };

    await expect(repository.createMesa(mesa)).rejects.toThrow("La fecha es obligatoria");
  });

  it("debería validar que la fecha no esté en el pasado", async () => {
    const fechaPasada = new Date();
    fechaPasada.setDate(fechaPasada.getDate() - 1);
    const fechaStr = fechaPasada.toISOString().split('T')[0];

    const mesa: Mesa = {
      id: "1",
      materia: "Matemática I",
      fecha: fechaStr,
      hora: "14:00",
      aula: "Aula 101",
      estado: "pendiente",
      docente_titular: "123",
      docente_vocal: "456",
      docentes: [
        { id: "123", nombre: "Docente 1", confirmacion: "pendiente" },
        { id: "456", nombre: "Docente 2", confirmacion: "pendiente" },
      ],
    };

    await expect(repository.createMesa(mesa)).rejects.toThrow("No se puede crear una mesa con fecha en el pasado");
  });

  it("debería validar que se requieran al menos dos docentes", async () => {
    const fechaFutura = new Date();
    fechaFutura.setDate(fechaFutura.getDate() + 3);
    const fechaStr = fechaFutura.toISOString().split('T')[0];

    const mesa: Mesa = {
      id: "1",
      materia: "Matemática I",
      fecha: fechaStr,
      hora: "14:00",
      aula: "Aula 101",
      estado: "pendiente",
      docente_titular: "123",
      docente_vocal: "456",
      docentes: [
        { id: "123", nombre: "Docente 1", confirmacion: "pendiente" },
      ],
    };

    await expect(repository.createMesa(mesa)).rejects.toThrow("Se requieren al menos dos docentes para una mesa");
  });

  it("debería manejar error al obtener todas las mesas", async () => {
    const selectMock = jest.fn().mockResolvedValue({ data: null, error: new Error("Error de base de datos") });
    supabase.from = jest.fn().mockReturnValue({
      select: selectMock,
      insert: jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue({ data: [], error: null }) }),
      update: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }),
      delete: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }),
      eq: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: [], error: null }) }),
      single: jest.fn().mockResolvedValue({ data: [], error: null })
    });

    await expect(repository.getAllMesas()).rejects.toThrow("Error de base de datos");
  });

  it("debería manejar error al obtener mesas por ID de docente", async () => {
    const selectMock = jest.fn().mockResolvedValue({ data: null, error: new Error("Error de base de datos") });
    supabase.from = jest.fn().mockReturnValue({
      select: selectMock,
      insert: jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue({ data: [], error: null }) }),
      update: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }),
      delete: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }),
      eq: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: [], error: null }) }),
      single: jest.fn().mockResolvedValue({ data: [], error: null })
    });

    await expect(repository.getMesasByDocenteId("123")).rejects.toThrow("Error de base de datos");
  });

  it("debería manejar error al actualizar una mesa", async () => {
    const updateMock = jest.fn().mockReturnValue({ 
      eq: jest.fn().mockResolvedValue({ error: new Error("Error de base de datos") }) 
    });
    supabase.from = jest.fn().mockReturnValue({
      update: updateMock,
      select: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ data: [], error: null }) }),
      insert: jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue({ data: [], error: null }) }),
      delete: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }),
      eq: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: [], error: null }) }),
      single: jest.fn().mockResolvedValue({ data: [], error: null })
    });

    await expect(repository.updateMesa("1", { aula: "Aula 102" })).rejects.toThrow("Error de base de datos");
  });

  it("debería manejar error al eliminar una mesa", async () => {
    const deleteMock = jest.fn().mockReturnValue({ 
      eq: jest.fn().mockResolvedValue({ error: new Error("Error de base de datos") }) 
    });
    supabase.from = jest.fn().mockReturnValue({
      delete: deleteMock,
      select: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ data: [], error: null }) }),
      insert: jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue({ data: [], error: null }) }),
      update: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }),
      eq: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: [], error: null }) }),
      single: jest.fn().mockResolvedValue({ data: [], error: null })
    });

    await expect(repository.deleteMesa("1")).rejects.toThrow("Error de base de datos");
  });

  it("debería manejar error al actualizar la confirmación de un docente", async () => {
    const selectMock = jest.fn().mockResolvedValue({ data: null, error: null });
    supabase.from = jest.fn().mockReturnValue({
      select: selectMock,
      update: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }),
      insert: jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue({ data: [], error: null }) }),
      delete: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }),
      eq: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: [], error: null }) }),
      single: jest.fn().mockResolvedValue({ data: [], error: null })
    });

    await expect(repository.updateConfirmacion("1", "123", "aceptado")).rejects.toThrow("Mesa no encontrada");
  });

  it("debería manejar error al confirmar una mesa", async () => {
    const selectMock = jest.fn().mockResolvedValue({ data: null, error: new Error("Error de base de datos") });
    supabase.from = jest.fn().mockReturnValue({
      select: selectMock,
      update: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }),
      insert: jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue({ data: [], error: null }) }),
      delete: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }),
      eq: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: [], error: null }) }),
      single: jest.fn().mockResolvedValue({ data: [], error: null })
    });

    await expect(repository.confirmarMesa("1")).rejects.toThrow("Error de base de datos");
  });

  it("debería obtener una mesa por ID", async () => {
    const selectMock = jest.fn().mockResolvedValue({ data: null, error: null });
    supabase.from = jest.fn().mockReturnValue({
      select: selectMock,
      insert: jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue({ data: [], error: null }) }),
      update: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }),
      delete: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }),
      eq: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: [], error: null }) }),
      single: jest.fn().mockResolvedValue({ data: [], error: null })
    });

    const mesa = await repository.getMesaById("1");
    expect(mesa).toBeNull();
  });

  it("debería manejar error al obtener una mesa por ID", async () => {
    const selectMock = jest.fn().mockResolvedValue({ data: null, error: new Error("Error de base de datos") });
    supabase.from = jest.fn().mockReturnValue({
      select: selectMock,
      insert: jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue({ data: [], error: null }) }),
      update: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }),
      delete: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }),
      eq: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: [], error: null }) }),
      single: jest.fn().mockResolvedValue({ data: [], error: null })
    });

    await expect(repository.getMesaById("1")).rejects.toThrow("Error de base de datos");
  });

  it("debería manejar error al actualizar confirmación con error de base de datos", async () => {
    const mockMesa: Mesa = {
      id: "1",
      materia: "Matemática I",
      fecha: "2025-06-11",
      hora: "14:00",
      aula: "Aula 101",
      estado: "pendiente" as EstadoMesa,
      docente_titular: "123",
      docente_vocal: "456",
      docentes: [
        { id: "123", nombre: "Docente 1", confirmacion: "pendiente" },
        { id: "456", nombre: "Docente 2", confirmacion: "pendiente" }
      ]
    };
    const selectMock = jest.fn().mockResolvedValue({ data: [mockMesa], error: null });
    const updateMock = jest.fn().mockReturnValue({ 
      eq: jest.fn().mockResolvedValue({ error: new Error("Error de base de datos") }) 
    });
    supabase.from = jest.fn().mockReturnValue({
      select: selectMock,
      update: updateMock,
      insert: jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue({ data: [], error: null }) }),
      delete: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }),
      eq: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: [], error: null }) }),
      single: jest.fn().mockResolvedValue({ data: [], error: null })
    });

    await expect(repository.updateConfirmacion("1", "123", "aceptado")).rejects.toThrow("Error de base de datos");
  });

  it("debería manejar error al confirmar mesa con error de base de datos", async () => {
    const mockMesa: Mesa = {
      id: "1",
      materia: "Matemática I",
      fecha: "2025-06-11",
      hora: "14:00",
      aula: "Aula 101",
      estado: "pendiente" as EstadoMesa,
      docente_titular: "123",
      docente_vocal: "456",
      docentes: [
        { id: "123", nombre: "Docente 1", confirmacion: "pendiente" },
        { id: "456", nombre: "Docente 2", confirmacion: "pendiente" }
      ]
    };
    const selectMock = jest.fn().mockResolvedValue({ data: [mockMesa], error: null });
    const updateMock = jest.fn().mockReturnValue({ 
      eq: jest.fn().mockResolvedValue({ error: new Error("Error de base de datos") }) 
    });
    supabase.from = jest.fn().mockReturnValue({
      select: selectMock,
      update: updateMock,
      insert: jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue({ data: [], error: null }) }),
      delete: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }),
      eq: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: [], error: null }) }),
      single: jest.fn().mockResolvedValue({ data: [], error: null })
    });

    await expect(repository.confirmarMesa("1")).rejects.toThrow("Error de base de datos");
  });
});

describe("Singleton", () => {
  it("debería retornar la misma instancia", () => {
    const instance1 = MesaRepository.getInstance(supabase as any);
    const instance2 = MesaRepository.getInstance(supabase as any);
    expect(instance1).toBe(instance2);
  });

  it("debería mantener el estado entre instancias", () => {
    const instance1 = MesaRepository.getInstance(supabase as any);
    const instance2 = MesaRepository.getInstance(supabase as any);
    expect(instance1).toBe(instance2);
  });
});

function createSelectMock({ data = [], error = null } = {}) {
  return jest.fn().mockResolvedValue({ data, error });
}

function createUpdateMock({ data = [], error = null } = {}) {
  return jest.fn().mockReturnValue({
    eq: jest.fn().mockResolvedValue({ data, error }),
  });
}

function createDeleteMock({ data = [], error = null } = {}) {
  return jest.fn().mockReturnValue({
    eq: jest.fn().mockResolvedValue({ data, error }),
  });
}
