import { MesaRepository } from "../MesaRepository";
import { supabase } from "../../config/supabase.test";
import { Mesa, EstadoMesa, EstadoConfirmacion } from "../../types";

describe("MesaRepository", () => {
  let repository: MesaRepository;

  beforeEach(() => {
    // Obtener una instancia del repositorio con el mock
    repository = MesaRepository.getInstance(supabase);
    supabase.from = jest.fn().mockReturnValue({
      select: createSelectMock(),
      update: createUpdateMock(),
      delete: createDeleteMock(),
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: [], error: null }),
      }),
    });
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

    // Configurar el mock para devolver las mesas
    const selectMock = jest
      .fn()
      .mockReturnValue(Promise.resolve({ data: mockMesas, error: null }));
    supabase.from = jest.fn().mockReturnValue({ select: selectMock });

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

    // Configurar el mock para devolver las mesas
    const selectMock = jest
      .fn()
      .mockReturnValue(Promise.resolve({ data: mockMesas, error: null }));
    supabase.from = jest.fn().mockReturnValue({ select: selectMock });

    const mesas = await repository.getMesasByDocenteId("123");
    expect(mesas).toHaveLength(1);
    expect(mesas[0].docente_titular).toBe("123");
  });

  it("debería crear una nueva mesa", async () => {
    // Crear una fecha 3 días en el futuro
    const fechaFutura = new Date();
    fechaFutura.setDate(fechaFutura.getDate() + 3);
    const fechaFuturaStr = fechaFutura.toISOString().split("T")[0];

    const nuevaMesa: Mesa = {
      id: "1",
      materia: "Matemática I",
      fecha: fechaFuturaStr,
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

    // Mock para verificar mesas existentes
    const selectMock = jest.fn().mockReturnValue({
      or: jest.fn().mockReturnValue(Promise.resolve({ data: [], error: null })),
    });

    // Mock para insertar la nueva mesa
    const insertMock = jest.fn().mockReturnValue({
      select: jest
        .fn()
        .mockReturnValue(Promise.resolve({ data: [nuevaMesa], error: null })),
    });

    // Configurar el mock para manejar ambas operaciones
    supabase.from = jest.fn().mockImplementation((table) => {
      if (table === "mesas") {
        return {
          select: selectMock,
          insert: insertMock,
        };
      }
      return {};
    });

    const mesaCreada = await repository.createMesa(nuevaMesa);
    expect(mesaCreada).toEqual(nuevaMesa);
  });

  it("debería actualizar una mesa existente", async () => {
    const mesaActualizada: Partial<Mesa> = {
      aula: "Aula 102",
    };

    const mesaActualizadaCompleta = {
      id: "1",
      aula: "Aula 102",
      materia: "Materia de prueba",
      fecha: "2023-01-01",
      hora: "10:00",
      docentes: [],
      estado: "pendiente",
      created_at: "2023-01-01T10:00:00Z",
      updated_at: "2023-01-01T10:00:00Z",
    };

    // Configurar el mock para la operación de update
    const updateMock = jest.fn().mockReturnValue({
      eq: jest
        .fn()
        .mockReturnValue(Promise.resolve({ data: null, error: null })),
    });

    // Configurar el mock para la operación de select después del update
    const selectMock = jest.fn().mockReturnValue({
      eq: jest
        .fn()
        .mockReturnValue(
          Promise.resolve({ data: [mesaActualizadaCompleta], error: null })
        ),
    });

    supabase.from = jest.fn().mockReturnValue({
      update: updateMock,
      select: selectMock,
    });

    const mesa = await repository.updateMesa("1", mesaActualizada);
    expect(mesa.aula).toBe("Aula 102");
  });

  it("debería eliminar una mesa", async () => {
    // Configurar el mock para simular la eliminación exitosa
    const deleteMock = jest.fn().mockReturnValue({
      eq: jest
        .fn()
        .mockReturnValue(Promise.resolve({ data: null, error: null })),
    });
    supabase.from = jest.fn().mockReturnValue({ delete: deleteMock });

    await expect(repository.deleteMesa("1")).resolves.not.toThrow();
  });

  it("debería manejar errores al obtener todas las mesas", async () => {
    // Configurar el mock para simular un error
    const selectMock = jest.fn().mockReturnValue(
      Promise.resolve({
        data: null,
        error: new Error("Error de base de datos"),
      })
    );
    supabase.from = jest.fn().mockReturnValue({ select: selectMock });

    await expect(repository.getAllMesas()).rejects.toThrow(
      "Error de base de datos"
    );
  });

  it("debería manejar errores al crear una mesa", async () => {
    const nuevaMesa: Mesa = {
      id: "1",
      materia: "Matemática I",
      fecha: "2024-03-20", // Fecha en el pasado
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

    await expect(repository.createMesa(nuevaMesa)).rejects.toThrow(
      "No se puede crear una mesa con fecha en el pasado"
    );
  });

  it("debería manejar errores al actualizar una mesa", async () => {
    const mesaActualizada: Partial<Mesa> = {
      aula: "Aula 102",
    };

    // Configurar el mock para simular un error en el update
    const updateMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue(
        Promise.resolve({
          data: null,
          error: new Error("Error al actualizar"),
        })
      ),
    });
    supabase.from = jest.fn().mockReturnValue({ update: updateMock });

    await expect(repository.updateMesa("1", mesaActualizada)).rejects.toThrow(
      "Error al actualizar"
    );
  });

  it("debería manejar errores al eliminar una mesa", async () => {
    // Configurar el mock para simular un error en el delete
    const deleteMock = jest.fn().mockReturnValue({
      eq: jest
        .fn()
        .mockReturnValue(
          Promise.resolve({ data: null, error: new Error("Error al eliminar") })
        ),
    });
    supabase.from = jest.fn().mockReturnValue({ delete: deleteMock });

    await expect(repository.deleteMesa("1")).rejects.toThrow(
      "Error al eliminar"
    );
  });

  it("debería actualizar la confirmación de un docente", async () => {
    const mesaOriginal = {
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

    const mesaActualizada = {
      ...mesaOriginal,
      docentes: [
        { id: "123", nombre: "Docente 1", confirmacion: "aceptado" },
        { id: "456", nombre: "Docente 2", confirmacion: "pendiente" },
      ],
    };

    // Mock para getMesaById
    const selectMock = jest.fn().mockReturnValue({
      eq: jest
        .fn()
        .mockReturnValue(
          Promise.resolve({ data: [mesaOriginal], error: null })
        ),
    });

    // Mock para update
    const updateMock = jest.fn().mockReturnValue({
      eq: jest
        .fn()
        .mockReturnValue(Promise.resolve({ data: null, error: null })),
    });

    // Mock para select después del update
    const selectAfterUpdateMock = jest.fn().mockReturnValue({
      eq: jest
        .fn()
        .mockReturnValue(
          Promise.resolve({ data: [mesaActualizada], error: null })
        ),
    });

    let selectCallCount = 0;
    supabase.from = jest.fn().mockImplementation((table) => {
      if (table === "mesas") {
        return {
          select: () => {
            selectCallCount++;
            if (selectCallCount === 1) {
              return selectMock();
            }
            return selectAfterUpdateMock();
          },
          update: updateMock,
        };
      }
      return {};
    });

    const mesa = await repository.updateConfirmacion("1", "123", "aceptado");
    expect(mesa.docentes[0].confirmacion).toBe("aceptado");
  });

  it("debería confirmar una mesa", async () => {
    const mesaOriginal = {
      id: "1",
      materia: "Matemática I",
      fecha: "2024-03-20",
      hora: "14:00",
      aula: "Aula 101",
      estado: "pendiente",
      docente_titular: "123",
      docente_vocal: "456",
      docentes: [
        { id: "123", nombre: "Docente 1", confirmacion: "aceptado" },
        { id: "456", nombre: "Docente 2", confirmacion: "aceptado" },
      ],
    };

    const mesaConfirmada = {
      ...mesaOriginal,
      estado: "confirmada",
    };

    // Mock para update
    const updateMock = jest.fn().mockReturnValue({
      eq: jest
        .fn()
        .mockReturnValue(Promise.resolve({ data: null, error: null })),
    });

    // Mock para select después del update
    const selectMock = jest.fn().mockReturnValue({
      eq: jest
        .fn()
        .mockReturnValue(
          Promise.resolve({ data: [mesaConfirmada], error: null })
        ),
    });

    supabase.from = jest.fn().mockReturnValue({
      update: updateMock,
      select: selectMock,
    });

    const mesa = await repository.confirmarMesa("1");
    expect(mesa.estado).toBe("confirmada");
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

    // Configurar el mock para devolver la mesa
    const selectMock = jest.fn().mockReturnValue({
      eq: jest
        .fn()
        .mockReturnValue(Promise.resolve({ data: [mockMesa], error: null })),
    });
    supabase.from = jest.fn().mockReturnValue({ select: selectMock });

    const mesa = await repository.getMesaById("1");
    expect(mesa).not.toBeNull();
    expect(mesa?.id).toBe("1");
  });

  it("debería retornar null cuando no se encuentra una mesa por ID", async () => {
    // Configurar el mock para devolver datos vacíos
    const selectMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue(Promise.resolve({ data: [], error: null })),
    });
    supabase.from = jest.fn().mockReturnValue({ select: selectMock });

    const mesa = await repository.getMesaById("999");
    expect(mesa).toBeNull();
  });

  it("debería manejar errores al insertar una mesa", async () => {
    const nuevaMesa: Mesa = {
      id: "1",
      materia: "Matemática I",
      fecha: "2025-05-31",
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

    // Mock para verificar mesas existentes
    const selectMock = jest.fn().mockReturnValue({
      or: jest.fn().mockReturnValue(Promise.resolve({ data: [], error: null })),
    });

    // Mock para insertar la nueva mesa con error
    const insertMock = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue(
        Promise.resolve({
          data: null,
          error: new Error("Error de base de datos"),
        })
      ),
    });

    supabase.from = jest.fn().mockImplementation((table) => {
      if (table === "mesas") {
        return {
          select: selectMock,
          insert: insertMock,
        };
      }
      return {};
    });

    await expect(repository.createMesa(nuevaMesa)).rejects.toThrow(
      "Error al crear mesa: Error de base de datos"
    );
  });

  it("debería manejar errores al actualizar una mesa", async () => {
    const mesaActualizada: Partial<Mesa> = {
      aula: "Aula 102",
    };

    // Mock para update con error
    const updateMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue(
        Promise.resolve({
          data: null,
          error: new Error("Error al actualizar"),
        })
      ),
    });

    supabase.from = jest.fn().mockReturnValue({
      update: updateMock,
    });

    await expect(repository.updateMesa("1", mesaActualizada)).rejects.toThrow(
      "Error al actualizar"
    );
  });

  it("debería manejar errores al actualizar la confirmación de un docente", async () => {
    const mesaOriginal = {
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

    // Mock para getMesaById
    const selectMock = jest.fn().mockReturnValue({
      eq: jest
        .fn()
        .mockReturnValue(
          Promise.resolve({ data: [mesaOriginal], error: null })
        ),
    });

    // Mock para update con error
    const updateMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue(
        Promise.resolve({
          data: null,
          error: new Error("Error al actualizar"),
        })
      ),
    });

    supabase.from = jest.fn().mockImplementation((table) => {
      if (table === "mesas") {
        return {
          select: selectMock,
          update: updateMock,
        };
      }
      return {};
    });

    await expect(
      repository.updateConfirmacion("1", "123", "aceptado")
    ).rejects.toThrow("Error al actualizar");
  });

  it("debería manejar errores al confirmar una mesa", async () => {
    // Mock para update con error
    const updateMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue(
        Promise.resolve({
          data: null,
          error: new Error("Error al confirmar"),
        })
      ),
    });

    supabase.from = jest.fn().mockReturnValue({
      update: updateMock,
    });

    await expect(repository.confirmarMesa("1")).rejects.toThrow(
      "Error al confirmar"
    );
  });

  it("debería manejar errores al obtener una mesa por ID", async () => {
    // Mock para select con error
    const selectMock = jest.fn().mockReturnValue({
      eq: jest
        .fn()
        .mockReturnValue(
          Promise.resolve({ data: null, error: new Error("Error al obtener") })
        ),
    });

    supabase.from = jest.fn().mockReturnValue({
      select: selectMock,
    });

    await expect(repository.getMesaById("1")).rejects.toThrow(
      "Error al obtener"
    );
  });

  it("debería manejar conflictos de horario al crear una mesa", async () => {
    const nuevaMesa: Mesa = {
      id: "1",
      materia: "Matemática I",
      fecha: "2025-05-31",
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

    const mesaExistente = {
      id: "2",
      materia: "Física I",
      fecha: "2025-05-31",
      hora: "15:00", // Conflicto: solo 1 hora de diferencia
      aula: "Aula 102",
      estado: "pendiente",
      docente_titular: "123",
      docente_vocal: "789",
      docentes: [
        { id: "123", nombre: "Docente 1", confirmacion: "pendiente" },
        { id: "789", nombre: "Docente 3", confirmacion: "pendiente" },
      ],
    };

    // Mock para verificar mesas existentes
    const selectMock = jest.fn().mockReturnValue({
      or: jest
        .fn()
        .mockReturnValue(
          Promise.resolve({ data: [mesaExistente], error: null })
        ),
    });

    supabase.from = jest.fn().mockImplementation((table) => {
      if (table === "mesas") {
        return {
          select: selectMock,
        };
      }
      return {};
    });

    await expect(repository.createMesa(nuevaMesa)).rejects.toThrow(
      "Conflicto de horario para el docente Docente 1"
    );
  });
});

describe("MesaRepository - Casos de error adicionales", () => {
  let repository: MesaRepository;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      from: jest.fn().mockImplementation(() => ({
        select: jest.fn().mockImplementation(() => ({
          or: jest.fn().mockResolvedValue({
            error: null,
            data: [],
          }),
        })),
        insert: jest.fn().mockImplementation(() => ({
          select: jest.fn().mockResolvedValue({
            error: null,
            data: [],
          }),
        })),
        update: jest.fn().mockImplementation(() => ({
          eq: jest.fn().mockResolvedValue({
            error: null,
            data: [],
          }),
        })),
        delete: jest.fn().mockImplementation(() => ({
          eq: jest.fn().mockResolvedValue({
            error: null,
            data: [],
          }),
        })),
      })),
    };
    repository = MesaRepository.getInstance(mockDb);
  });

  it("debería manejar error al verificar mesas existentes", async () => {
    const mesa: Mesa = {
      id: "1",
      materia: "Matemática I",
      fecha: "2025-05-31",
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

    mockDb.from.mockImplementation(() => ({
      select: jest.fn().mockImplementation(() => ({
        or: jest.fn().mockResolvedValue({
          error: new Error("Error de base de datos"),
          data: null,
        }),
      })),
    }));

    await expect(repository.createMesa(mesa)).rejects.toThrow(
      "Error al verificar disponibilidad: Error de base de datos"
    );
  });

  it("debería manejar error al no recibir datos al crear mesa", async () => {
    const mesa: Mesa = {
      id: "1",
      materia: "Matemática I",
      fecha: "2025-05-31",
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

    mockDb.from.mockImplementation(() => ({
      select: jest.fn().mockImplementation(() => ({
        or: jest.fn().mockResolvedValue({
          error: null,
          data: [],
        }),
      })),
      insert: jest.fn().mockImplementation(() => ({
        select: jest.fn().mockResolvedValue({
          error: null,
          data: [],
        }),
      })),
    }));

    await expect(repository.createMesa(mesa)).rejects.toThrow(
      "No se pudo crear la mesa: no se recibieron datos"
    );
  });

  it("debería manejar error al actualizar mesa", async () => {
    const mesaId = "1";
    const mesaActualizada: Partial<Mesa> = {
      aula: "Aula 102",
    };

    mockDb.from.mockImplementation(() => ({
      update: jest.fn().mockImplementation(() => ({
        eq: jest.fn().mockResolvedValue({
          error: new Error("Error al actualizar"),
          data: null,
        }),
      })),
    }));

    await expect(
      repository.updateMesa(mesaId, mesaActualizada)
    ).rejects.toThrow("Error al actualizar");
  });

  it("debería manejar error al no encontrar mesa actualizada", async () => {
    const mesaId = "1";
    const mesaActualizada: Partial<Mesa> = {
      aula: "Aula 102",
    };

    mockDb.from.mockImplementation(() => ({
      update: jest.fn().mockImplementation(() => ({
        eq: jest.fn().mockResolvedValue({
          error: null,
          data: [],
        }),
      })),
      select: jest.fn().mockImplementation(() => ({
        eq: jest.fn().mockResolvedValue({
          error: null,
          data: [],
        }),
      })),
    }));

    await expect(
      repository.updateMesa(mesaId, mesaActualizada)
    ).rejects.toThrow("No se encontró la mesa actualizada");
  });

  it("debería manejar error al eliminar mesa", async () => {
    const mesaId = "1";

    mockDb.from.mockImplementation(() => ({
      delete: jest.fn().mockImplementation(() => ({
        eq: jest.fn().mockResolvedValue({
          error: new Error("Error al eliminar"),
          data: null,
        }),
      })),
    }));

    await expect(repository.deleteMesa(mesaId)).rejects.toThrow(
      "Error al eliminar"
    );
  });

  it("debería manejar error al actualizar confirmación", async () => {
    const mesaId = "1";
    const docenteId = "123";
    const confirmacion: EstadoConfirmacion = "aceptado";

    mockDb.from.mockImplementation(() => ({
      select: jest.fn().mockImplementation(() => ({
        eq: jest.fn().mockResolvedValue({
          error: null,
          data: [
            {
              id: mesaId,
              docentes: [{ id: docenteId, confirmacion: "pendiente" }],
            },
          ],
        }),
      })),
      update: jest.fn().mockImplementation(() => ({
        eq: jest.fn().mockResolvedValue({
          error: new Error("Error al actualizar confirmación"),
          data: null,
        }),
      })),
    }));

    await expect(
      repository.updateConfirmacion(mesaId, docenteId, confirmacion)
    ).rejects.toThrow("Error al actualizar confirmación");
  });

  it("debería manejar error al confirmar mesa", async () => {
    const mesaId = "1";

    mockDb.from.mockImplementation(() => ({
      update: jest.fn().mockImplementation(() => ({
        eq: jest.fn().mockResolvedValue({
          error: new Error("Error al confirmar mesa"),
          data: null,
        }),
      })),
    }));

    await expect(repository.confirmarMesa(mesaId)).rejects.toThrow(
      "Error al confirmar mesa"
    );
  });

  it("debería manejar error al obtener mesa por ID", async () => {
    const mesaId = "1";

    mockDb.from.mockImplementation(() => ({
      select: jest.fn().mockImplementation(() => ({
        eq: jest.fn().mockResolvedValue({
          error: new Error("Error al obtener mesa"),
          data: null,
        }),
      })),
    }));

    await expect(repository.getMesaById(mesaId)).rejects.toThrow(
      "Error al obtener mesa"
    );
  });
});

describe("MesaRepository - Validaciones adicionales", () => {
  let repository: MesaRepository;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      from: jest.fn().mockImplementation(() => ({
        select: jest.fn().mockImplementation(() => ({
          or: jest.fn().mockResolvedValue({
            error: null,
            data: [],
          }),
        })),
        insert: jest.fn().mockImplementation(() => ({
          select: jest.fn().mockResolvedValue({
            error: null,
            data: [],
          }),
        })),
        update: jest.fn().mockImplementation(() => ({
          eq: jest.fn().mockResolvedValue({
            error: null,
            data: [],
          }),
        })),
        delete: jest.fn().mockImplementation(() => ({
          eq: jest.fn().mockResolvedValue({
            error: null,
            data: [],
          }),
        })),
      })),
    };
    repository = MesaRepository.getInstance(mockDb);
  });

  it("debería validar que la materia sea obligatoria", async () => {
    const mesa: Mesa = {
      id: "1",
      materia: "",
      fecha: "2025-05-31",
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

    await expect(repository.createMesa(mesa)).rejects.toThrow(
      "La materia es obligatoria"
    );
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

    await expect(repository.createMesa(mesa)).rejects.toThrow(
      "La fecha es obligatoria"
    );
  });

  it("debería validar que la fecha sea al menos 48 horas en el futuro", async () => {
    const mesa: Mesa = {
      id: "1",
      materia: "Matemática I",
      fecha: "2025-05-29", // Menos de 48 horas en el futuro
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

    await expect(repository.createMesa(mesa)).rejects.toThrow(
      "La fecha de la mesa debe ser al menos 48 horas"
    );
  });

  it("debería validar que se requieran al menos dos docentes", async () => {
    const mesa: Mesa = {
      id: "1",
      materia: "Matemática I",
      fecha: "2025-05-31",
      hora: "14:00",
      aula: "Aula 101",
      estado: "pendiente",
      docente_titular: "123",
      docente_vocal: "456",
      docentes: [{ id: "123", nombre: "Docente 1", confirmacion: "pendiente" }],
    };

    await expect(repository.createMesa(mesa)).rejects.toThrow(
      "Se requieren al menos dos docentes para una mesa"
    );
  });

  it("debería validar que se requieran al menos dos docentes cuando el array es vacío", async () => {
    const mesa: Mesa = {
      id: "1",
      materia: "Matemática I",
      fecha: "2025-05-31",
      hora: "14:00",
      aula: "Aula 101",
      estado: "pendiente",
      docente_titular: "123",
      docente_vocal: "456",
      docentes: [],
    };

    await expect(repository.createMesa(mesa)).rejects.toThrow(
      "Se requieren al menos dos docentes para una mesa"
    );
  });

  it("debería validar que se requieran al menos dos docentes cuando el array es undefined", async () => {
    const mesa: Mesa = {
      id: "1",
      materia: "Matemática I",
      fecha: "2025-05-31",
      hora: "14:00",
      aula: "Aula 101",
      estado: "pendiente",
      docente_titular: "123",
      docente_vocal: "456",
      docentes: undefined as any,
    };

    await expect(repository.createMesa(mesa)).rejects.toThrow(
      "Se requieren al menos dos docentes para una mesa"
    );
  });

  it("debería validar que se requieran al menos dos docentes cuando el array no es un array", async () => {
    const mesa: Mesa = {
      id: "1",
      materia: "Matemática I",
      fecha: "2025-05-31",
      hora: "14:00",
      aula: "Aula 101",
      estado: "pendiente",
      docente_titular: "123",
      docente_vocal: "456",
      docentes: {} as any,
    };

    await expect(repository.createMesa(mesa)).rejects.toThrow(
      "Se requieren al menos dos docentes para una mesa"
    );
  });
});

describe("MesaRepository - Casos de error en operaciones CRUD", () => {
  it("debería manejar errores al actualizar una mesa", async () => {
    const mockDb = {
      from: jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest
            .fn()
            .mockResolvedValue({ error: new Error("Error de base de datos") }),
        }),
      }),
    };
    const repository = MesaRepository.getInstance(mockDb as any);
    await expect(
      repository.updateMesa("1", { materia: "Nueva Materia" })
    ).rejects.toThrow("Error de base de datos");
  });

  it("debería manejar errores al eliminar una mesa", async () => {
    const mockDb = {
      from: jest.fn().mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest
            .fn()
            .mockResolvedValue({ error: new Error("Error de base de datos") }),
        }),
      }),
    };
    const repository = MesaRepository.getInstance(mockDb as any);
    await expect(repository.deleteMesa("1")).rejects.toThrow(
      "Error de base de datos"
    );
  });

  it("debería manejar errores al actualizar la confirmación de un docente", async () => {
    const mockDb = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [{}] }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest
            .fn()
            .mockResolvedValue({ error: new Error("Error de base de datos") }),
        }),
      }),
    };
    const repository = MesaRepository.getInstance(mockDb as any);
    await expect(
      repository.updateConfirmacion("1", "123", "confirmada" as any)
    ).rejects.toThrow("Error de base de datos");
  });

  it("debería manejar errores al confirmar una mesa", async () => {
    const mockDb = {
      from: jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest
            .fn()
            .mockResolvedValue({ error: new Error("Error de base de datos") }),
        }),
      }),
    };
    const repository = MesaRepository.getInstance(mockDb as any);
    await expect(repository.confirmarMesa("1")).rejects.toThrow(
      "Error de base de datos"
    );
  });

  it("debería manejar errores al obtener una mesa por ID", async () => {
    const mockDb = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest
            .fn()
            .mockResolvedValue({ error: new Error("Error de base de datos") }),
        }),
      }),
    };
    const repository = MesaRepository.getInstance(mockDb as any);
    await expect(repository.getMesaById("1")).rejects.toThrow(
      "Error de base de datos"
    );
  });
});

describe("MesaRepository - Constructor y Singleton", () => {
  it("debería crear una única instancia del repositorio", () => {
    const instance1 = MesaRepository.getInstance(supabase);
    const instance2 = MesaRepository.getInstance(supabase);
    expect(instance1).toBe(instance2);
  });

  it("debería permitir actualizar el cliente de base de datos", () => {
    const mockDb = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [] }),
        }),
      }),
    };
    const instance1 = MesaRepository.getInstance(supabase);
    const instance2 = MesaRepository.getInstance(mockDb as any);
    expect(instance1).toBe(instance2);
  });
});

describe("MesaRepository - Cobertura de errores no cubiertos", () => {
  let repository: MesaRepository;
  beforeEach(() => {
    repository = MesaRepository.getInstance(supabase);
  });

  it("debería manejar errores al obtener mesas por docente (error en select)", async () => {
    const selectMock = jest.fn().mockReturnValue(
      Promise.resolve({
        data: null,
        error: new Error("Error de base de datos"),
      })
    );
    supabase.from = jest.fn().mockReturnValue({ select: selectMock });
    await expect(repository.getMesasByDocenteId("123")).rejects.toThrow(
      "Error de base de datos"
    );
  });

  it("debería manejar error si no se encuentra la mesa actualizada al actualizar confirmación", async () => {
    // Mock para getMesaById y update
    const mesaOriginal = {
      id: "1",
      materia: "Matemática I",
      fecha: "2025-05-31",
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
    let selectCallCount = 0;
    supabase.from = jest.fn().mockImplementation((table) => {
      if (table === "mesas") {
        return {
          select: () => ({
            eq: jest.fn().mockImplementation(() => {
              selectCallCount++;
              if (selectCallCount === 1) {
                return Promise.resolve({ data: [mesaOriginal], error: null });
              }
              // Segunda llamada: después del update, devuelve []
              return Promise.resolve({ data: [], error: null });
            }),
          }),
          update: () => ({
            eq: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        };
      }
      return {};
    });
    await expect(
      repository.updateConfirmacion("1", "123", "aceptado")
    ).rejects.toThrow("No se encontró la mesa actualizada");
  });

  it("debería manejar error si no se encuentra la mesa actualizada al confirmar mesa", async () => {
    supabase.from = jest.fn().mockReturnValue({
      update: () => ({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
      select: () => ({
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
      }),
    });
    await expect(repository.confirmarMesa("1")).rejects.toThrow(
      "No se encontró la mesa actualizada"
    );
  });

  it("debería manejar error al obtener mesa por ID (error en select)", async () => {
    supabase.from = jest.fn().mockReturnValue({
      select: () => ({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: new Error("Error de base de datos"),
        }),
      }),
    });
    await expect(repository.getMesaById("1")).rejects.toThrow(
      "Error de base de datos"
    );
  });
});

describe("MesaRepository - Cobertura 100% líneas críticas (final)", () => {
  beforeEach(() => {
    // @ts-ignore
    MesaRepository.instance = undefined;
  });

  it("debería lanzar error en updateMesa si updateResult.error existe", async () => {
    const mockDb = {
      from: jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: new Error("Error update") }),
        }),
        select: jest.fn(),
      }),
    };
    const repo = MesaRepository.getInstance(mockDb as any);
    await expect(repo.updateMesa("1", { materia: "X" })).rejects.toThrow(
      "Error update"
    );
  });

  it("debería lanzar error en deleteMesa si result.error existe", async () => {
    const mockDb = {
      from: jest.fn().mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: new Error("Error delete") }),
        }),
      }),
    };
    const repo = MesaRepository.getInstance(mockDb as any);
    await expect(repo.deleteMesa("1")).rejects.toThrow("Error delete");
  });

  it("debería lanzar error en getMesaById si result.error existe", async () => {
    const mockDb = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest
            .fn()
            .mockResolvedValue({ error: new Error("Error getMesaById") }),
        }),
      }),
    };
    const repo = MesaRepository.getInstance(mockDb as any);
    await expect(repo.getMesaById("1")).rejects.toThrow("Error getMesaById");
  });
});

// Utilidad para crear un mock de query builder compatible con Supabase
function createSelectMock({ data = [], error = null } = {}) {
  return jest.fn().mockReturnValue({
    or: jest.fn().mockResolvedValue({ data, error }),
    eq: jest.fn().mockResolvedValue({ data, error }),
  });
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
