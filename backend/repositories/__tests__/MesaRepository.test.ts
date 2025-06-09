import { MesaRepository } from "../MesaRepository";

describe("MesaRepository", () => {
  let repo: MesaRepository;
  let db: any;

  beforeEach(() => {
<<<<<<< HEAD
    db = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: [], error: null }),
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({ data: [{}], error: null }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [{ id: "1", materia: "Física" }],
            error: null,
          }),
        }),
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [{}], error: null }),
        }),
      }),
    };
    repo = new MesaRepository(db);
  });

  it("debería obtener todas las mesas", async () => {
    await expect(repo.getAllMesas()).resolves.toBeInstanceOf(Array);
  });

  it("debería obtener mesas por docente", async () => {
    await expect(repo.getMesasByDocenteId("doc1")).resolves.toBeInstanceOf(
      Array
    );
  });

  it("debería crear una mesa con fecha válida", async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    const fecha = futureDate.toISOString().split("T")[0];
    const mesa = {
      materia: "Matemática",
      fecha,
      hora: "10:00",
      aula: "A",
=======
    // Obtener una instancia del repositorio con el mock
    repository = MesaRepository.getInstance(supabase);
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
    supabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: mockMesas, error: null }),
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

    // Configurar el mock para devolver las mesas
    supabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: mockMesas, error: null }),
    });

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

    // Mock para insertar la nueva mesa
    supabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: [nuevaMesa], error: null }),
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: [nuevaMesa], error: null }),
      }),
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

    // Configurar el mock para la operación de update y select
    supabase.from = jest.fn().mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
      select: jest.fn().mockResolvedValue({ data: [mesaActualizadaCompleta], error: null }),
    });

    const mesa = await repository.updateMesa("1", mesaActualizada);
    expect(mesa.aula).toBe("Aula 102");
  });

  it("debería eliminar una mesa", async () => {
    // Configurar el mock para simular la eliminación exitosa
    supabase.from = jest.fn().mockReturnValue({
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
    });

    await expect(repository.deleteMesa("1")).resolves.not.toThrow();
  });

  it("debería manejar errores al obtener todas las mesas", async () => {
    // Configurar el mock para simular un error
    supabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({
        data: null,
        error: new Error("Error de base de datos"),
      }),
    });

    await expect(repository.getAllMesas()).rejects.toThrow("Error de base de datos");
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
>>>>>>> origin/main
      docentes: [
        { id: "1", nombre: "Juan" },
        { id: "2", nombre: "Ana" },
      ],
    };
    await expect(repo.createMesa(mesa as any)).resolves.toBeDefined();
  });

<<<<<<< HEAD
  it("debería lanzar error si la materia es obligatoria", async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    const fecha = futureDate.toISOString().split("T")[0];
    const mesa = {
      fecha,
      hora: "10:00",
      aula: "A",
=======
  it("debería manejar errores al actualizar una mesa", async () => {
    const mesaActualizada: Partial<Mesa> = {
      aula: "Aula 102",
    };

    // Configurar el mock para simular un error en el update
    supabase.from = jest.fn().mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: new Error("Error al actualizar"),
        }),
      }),
    });

    await expect(repository.updateMesa("1", mesaActualizada)).rejects.toThrow(
      "Error al actualizar"
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
>>>>>>> origin/main
      docentes: [
        { id: "1", nombre: "Juan" },
        { id: "2", nombre: "Ana" },
      ],
    };
<<<<<<< HEAD
    await expect(repo.createMesa(mesa as any)).rejects.toThrow(
=======

    const mesaActualizada = {
      ...mesaOriginal,
      docentes: [
        { id: "123", nombre: "Docente 1", confirmacion: "aceptado" },
        { id: "456", nombre: "Docente 2", confirmacion: "pendiente" },
      ],
    };

    let selectCallCount = 0;
    supabase.from = jest.fn().mockImplementation((table) => {
      if (table === "mesas") {
        return {
          select: jest.fn().mockImplementation(() => {
            selectCallCount++;
            if (selectCallCount === 1) {
              return Promise.resolve({ data: [mesaOriginal], error: null });
            }
            return Promise.resolve({ data: [mesaActualizada], error: null });
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
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

    supabase.from = jest.fn().mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
      select: jest.fn().mockResolvedValue({ data: [mesaConfirmada], error: null }),
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
    supabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: [mockMesa], error: null }),
    });

    const mesa = await repository.getMesaById("1");
    expect(mesa).not.toBeNull();
    expect(mesa?.id).toBe("1");
  });

  it("debería retornar null cuando no se encuentra una mesa por ID", async () => {
    // Configurar el mock para devolver datos vacíos
    supabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: [], error: null }),
    });

    const mesa = await repository.getMesaById("999");
    expect(mesa).toBeNull();
  });

  it("debería manejar errores al eliminar una mesa", async () => {
    // Configurar el mock para simular un error en el delete
    supabase.from = jest.fn().mockReturnValue({
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: new Error("Error al eliminar"),
        }),
      }),
    });

    await expect(repository.deleteMesa("1")).rejects.toThrow("Error al eliminar");
  });

  it("debería rechazar una mesa sin materia", async () => {
    const nuevaMesa: Mesa = {
      id: "1",
      materia: "",
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

    await expect(repository.createMesa(nuevaMesa)).rejects.toThrow("La materia es obligatoria");
  });

  it("debería rechazar una mesa sin fecha", async () => {
    const nuevaMesa: Mesa = {
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

    await expect(repository.createMesa(nuevaMesa)).rejects.toThrow("La fecha es obligatoria");
  });

  it("debería rechazar una mesa con menos de dos docentes", async () => {
    const nuevaMesa: Mesa = {
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
      ],
    };

    await expect(repository.createMesa(nuevaMesa)).rejects.toThrow("Se requieren al menos dos docentes para una mesa");
  });

  it("debería rechazar una mesa con conflicto de horario", async () => {
    const nuevaMesa: Mesa = {
      id: "1",
      materia: "Matemática I",
      fecha: "2024-03-20",
      hora: "15:00",
      aula: "Aula 101",
      estado: "pendiente",
      docente_titular: "123",
      docente_vocal: "456",
      docentes: [
        { id: "123", nombre: "Docente 1", confirmacion: "pendiente" },
        { id: "456", nombre: "Docente 2", confirmacion: "pendiente" },
      ],
    };

    // Mock de mesas existentes con conflicto de horario
    supabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({
        data: [{
          id: "2",
          materia: "Otra Materia",
          fecha: "2024-03-20",
          hora: "16:00",
          aula: "Aula 102",
          estado: "pendiente",
          docente_titular: "123",
          docente_vocal: "789",
          docentes: [
            { id: "123", nombre: "Docente 1", confirmacion: "pendiente" },
            { id: "789", nombre: "Docente 3", confirmacion: "pendiente" },
          ],
        }],
        error: null,
      }),
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: [nuevaMesa], error: null }),
      }),
    });

    await expect(repository.createMesa(nuevaMesa)).rejects.toThrow("Conflicto de horario para el docente");
  });

  it("debería manejar el caso cuando la mesa no existe en updateMesa", async () => {
    supabase.from = jest.fn().mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
      select: jest.fn().mockResolvedValue({ data: [], error: null }),
    });

    const mesaActualizada: Partial<Mesa> = {
      aula: "Aula 102",
    };

    await expect(repository.updateMesa("999", mesaActualizada)).rejects.toThrow("No se encontró la mesa actualizada");
  });

  it("debería manejar errores en la consulta select después del update", async () => {
    supabase.from = jest.fn().mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
      select: jest.fn().mockResolvedValue({
        data: null,
        error: new Error("Error al obtener la mesa actualizada"),
      }),
    });

    const mesaActualizada: Partial<Mesa> = {
      aula: "Aula 102",
    };

    await expect(repository.updateMesa("1", mesaActualizada)).rejects.toThrow("Error al obtener la mesa actualizada");
  });

  it("debería manejar el caso cuando no hay mesas en getMesasByDocenteId", async () => {
    supabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: [], error: null }),
    });
    const mesas = await repository.getMesasByDocenteId("123");
    expect(mesas).toEqual([]);
  });

  it("debería manejar el caso cuando hay un error en la consulta de getMesasByDocenteId", async () => {
    supabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({
        data: null,
        error: new Error("Error al obtener mesas"),
      }),
    });

    await expect(repository.getMesasByDocenteId("123")).rejects.toThrow("Error al obtener mesas");
  });

  it("debería rechazar la creación de una mesa sin materia", async () => {
    const nuevaMesa = {
      id: "1",
      materia: "",
      fecha: "2025-06-11",
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
    await expect(repository.createMesa(nuevaMesa as any)).rejects.toThrow("La materia es obligatoria");
  });

  it("debería rechazar la creación de una mesa sin fecha", async () => {
    const nuevaMesa = {
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
    await expect(repository.createMesa(nuevaMesa as any)).rejects.toThrow("La fecha es obligatoria");
  });

  it("debería rechazar la creación de una mesa con menos de dos docentes", async () => {
    const nuevaMesa = {
      id: "1",
      materia: "Matemática I",
      fecha: "2025-06-11",
      hora: "14:00",
      aula: "Aula 101",
      estado: "pendiente",
      docente_titular: "123",
      docente_vocal: "",
      docentes: [
        { id: "123", nombre: "Docente 1", confirmacion: "pendiente" },
      ],
    };
    await expect(repository.createMesa(nuevaMesa as any)).rejects.toThrow("Se requieren al menos dos docentes para una mesa");
  });

  it("debería rechazar la creación de una mesa con conflicto de horario", async () => {
    // Simular conflicto de horario
    supabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: [{ id: "2" }], error: null }),
    });
    const nuevaMesa = {
      id: "1",
      materia: "Matemática I",
      fecha: "2025-06-11",
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
    await expect(repository.createMesa(nuevaMesa as any)).rejects.toThrow("Conflicto de horario para el docente");
  });

  it("debería manejar error si la mesa a actualizar no existe", async () => {
    // Simular que no se encuentra la mesa actualizada
    supabase.from = jest.fn().mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
      select: jest.fn().mockResolvedValue({ data: [], error: null }),
    });
    const mesaActualizada = { aula: "Aula 102" };
    await expect(repository.updateMesa("999", mesaActualizada)).rejects.toThrow("No se encontró la mesa actualizada");
  });

  it("debería manejar error en el select después de actualizar una mesa", async () => {
    // Simular error en el select
    supabase.from = jest.fn().mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
      select: jest.fn().mockResolvedValue({ data: null, error: new Error("Error al obtener la mesa actualizada") }),
    });
    const mesaActualizada = { aula: "Aula 102" };
    await expect(repository.updateMesa("1", mesaActualizada)).rejects.toThrow("Error al obtener la mesa actualizada");
  });

  it("debería devolver un array vacío si no hay mesas para el docente", async () => {
    supabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: [], error: null }),
    });
    const mesas = await repository.getMesasByDocenteId("123");
    expect(mesas).toEqual([]);
  });

  it("debería manejar error al obtener mesas por docente", async () => {
    supabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: null, error: new Error("Error al obtener mesas") }),
    });
    await expect(repository.getMesasByDocenteId("123")).rejects.toThrow("Error al obtener mesas");
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
        select: jest.fn().mockResolvedValue({ data: [], error: null }),
      }),
    };
    const instance1 = MesaRepository.getInstance(supabase);
    const instance2 = MesaRepository.getInstance(mockDb as any);
    expect(instance1).toBe(instance2);
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
        eq: jest
          .fn()
          .mockResolvedValue({
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
>>>>>>> origin/main
      "La materia es obligatoria"
    );
  });

  it("debería lanzar error si la fecha es obligatoria", async () => {
    const mesa = {
      materia: "Matemática",
      hora: "10:00",
      aula: "A",
      docentes: [
        { id: "1", nombre: "Juan" },
        { id: "2", nombre: "Ana" },
      ],
    };
    await expect(repo.createMesa(mesa as any)).rejects.toThrow(
      "La fecha es obligatoria"
    );
  });

  it("debería lanzar error si hay menos de dos docentes", async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    const fecha = futureDate.toISOString().split("T")[0];
    const mesa = {
      materia: "Matemática",
      fecha,
      hora: "10:00",
      aula: "A",
      docentes: [{ id: "1", nombre: "Juan" }],
    };
    await expect(repo.createMesa(mesa as any)).rejects.toThrow(
      "Se requieren al menos dos docentes para una mesa"
    );
  });

  it("debería lanzar error si la fecha es en el pasado", async () => {
    const mesa = {
      materia: "Matemática",
      fecha: "2000-01-01",
      hora: "10:00",
      aula: "A",
      docentes: [
        { id: "1", nombre: "Juan" },
        { id: "2", nombre: "Ana" },
      ],
    };
    await expect(repo.createMesa(mesa as any)).rejects.toThrow(
      "No se puede crear una mesa con fecha en el pasado"
    );
  });

  it("debería actualizar una mesa", async () => {
    db.from = jest.fn().mockReturnValue({
      update: jest
        .fn()
        .mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }),
      select: jest.fn(),
      insert: jest.fn(),
      delete: jest.fn(),
    });
    repo = new MesaRepository(db);
    repo.getMesaById = jest
      .fn()
      .mockResolvedValue({ id: "1", materia: "Física" });
    await expect(repo.updateMesa("1", { materia: "Física" })).resolves.toEqual({
      id: "1",
      materia: "Física",
    });
  });

  it("debería eliminar una mesa", async () => {
    await expect(repo.deleteMesa("1")).resolves.toBeUndefined();
  });

  it("debería manejar error de base de datos en getAllMesas", async () => {
    db.from = jest.fn().mockReturnValue({
      select: jest
        .fn()
        .mockResolvedValue({ data: null, error: { message: "fail" } }),
    });
    repo = new MesaRepository(db);
    await expect(repo.getAllMesas()).rejects.toThrow("fail");
  });

<<<<<<< HEAD
  it("debería manejar error al verificar mesas existentes en createMesa", async () => {
    db.from = jest
      .fn()
      .mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({ data: [], error: null }),
=======
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
>>>>>>> origin/main
      })
      .mockReturnValueOnce({
        select: jest
          .fn()
          .mockResolvedValue({ data: null, error: { message: "DB Error" } }),
      });

    repo = new MesaRepository(db);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    const fecha = futureDate.toISOString().split("T")[0];
    const mesa = {
      materia: "Matemática",
      fecha,
      hora: "10:00",
      aula: "A",
      docentes: [
        { id: "1", nombre: "Juan" },
        { id: "2", nombre: "Ana" },
      ],
    };

    await expect(repo.createMesa(mesa as any)).rejects.toThrow(
      "Error al verificar disponibilidad: DB Error"
    );
  });

  it("debería detectar conflicto de horario entre mesas", async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    const fecha = futureDate.toISOString().split("T")[0];

    const mesaExistente = {
      id: "existing-mesa",
      fecha,
      hora: "10:00",
      docente_titular: "1",
      docente_vocal: "2",
    };

    db.from = jest
      .fn()
      .mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({ data: [], error: null }),
      })
      .mockReturnValueOnce({
        select: jest
          .fn()
          .mockResolvedValue({ data: [mesaExistente], error: null }),
      });

    repo = new MesaRepository(db);

    const mesa = {
      materia: "Matemática",
      fecha,
      hora: "12:00", // 2 horas después, menor a las 4 requeridas
      aula: "A",
      docentes: [
        { id: "1", nombre: "Juan" },
        { id: "3", nombre: "Carlos" },
      ],
    };

    await expect(repo.createMesa(mesa as any)).rejects.toThrow(
      "Conflicto de horario para el docente"
    );
  });

  it("debería manejar error al insertar en BD", async () => {
    db.from = jest
      .fn()
      .mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({ data: [], error: null }),
      })
      .mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({ data: [], error: null }),
      })
      .mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: null,
            error: { message: "Insert failed" },
          }),
        }),
      });

    repo = new MesaRepository(db);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    const fecha = futureDate.toISOString().split("T")[0];
    const mesa = {
      materia: "Matemática",
      fecha,
      hora: "10:00",
      aula: "A",
      docentes: [
        { id: "1", nombre: "Juan" },
        { id: "2", nombre: "Ana" },
      ],
    };

    await expect(repo.createMesa(mesa as any)).rejects.toThrow(
      "Error al crear mesa: Insert failed"
    );
  });

  it("debería manejar cuando no se reciben datos al crear mesa", async () => {
    db.from = jest
      .fn()
      .mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({ data: [], error: null }),
      })
      .mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({ data: [], error: null }),
      })
      .mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

    repo = new MesaRepository(db);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    const fecha = futureDate.toISOString().split("T")[0];
    const mesa = {
      materia: "Matemática",
      fecha,
      hora: "10:00",
      aula: "A",
      docentes: [
        { id: "1", nombre: "Juan" },
        { id: "2", nombre: "Ana" },
      ],
    };

    await expect(repo.createMesa(mesa as any)).rejects.toThrow(
      "No se pudo crear la mesa: no se recibieron datos"
    );
  });

  it("debería manejar error en updateMesa cuando falla la actualización", async () => {
    db.from = jest.fn().mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest
          .fn()
          .mockResolvedValue({ error: { message: "Update failed" } }),
      }),
    });

    repo = new MesaRepository(db);

    await expect(repo.updateMesa("1", { materia: "Física" })).rejects.toThrow(
      "Update failed"
    );
  });

  it("debería manejar error en updateMesa cuando no encuentra la mesa actualizada", async () => {
    db.from = jest.fn().mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
      select: jest.fn().mockResolvedValue({ data: [], error: null }),
    });

    repo = new MesaRepository(db);

    await expect(repo.updateMesa("1", { materia: "Física" })).rejects.toThrow(
      "No se encontró la mesa actualizada"
    );
  });

  it("debería obtener mesa por ID correctamente", async () => {
    const mockMesa = {
      id: "1",
      materia: "Matemática",
      fecha: "2025-01-01",
      hora: "10:00",
      aula: "A",
      estado: "pendiente",
      docente_titular: "doc1",
      docente_vocal: "doc2",
      docentes: [],
    };

    db.from = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: [mockMesa], error: null }),
    });

    repo = new MesaRepository(db);
    const resultado = await repo.getMesaById("1");

    expect(resultado).toBeDefined();
    expect(resultado?.id).toBe("1");
    expect(resultado?.materia).toBe("Matemática");
  });

  it("debería devolver null cuando no encuentra mesa por ID", async () => {
    db.from = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: [], error: null }),
    });

    repo = new MesaRepository(db);
    const resultado = await repo.getMesaById("inexistente");

    expect(resultado).toBeNull();
  });

  it("debería actualizar confirmación de docente correctamente", async () => {
    const mockMesa = {
      id: "1",
      materia: "Matemática",
      fecha: "2025-01-01",
      hora: "10:00",
      aula: "A",
      estado: "pendiente",
      docente_titular: "doc1",
      docente_vocal: "doc2",
      docentes: [
        { id: "doc1", nombre: "Juan", confirmacion: "pendiente" },
        { id: "doc2", nombre: "Ana", confirmacion: "pendiente" },
      ],
    };

    db.from = jest
      .fn()
      .mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({ data: [mockMesa], error: null }),
      })
      .mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      })
      .mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({
          data: [
            {
              ...mockMesa,
              docentes: [
                { id: "doc1", nombre: "Juan", confirmacion: "aceptado" },
                { id: "doc2", nombre: "Ana", confirmacion: "pendiente" },
              ],
            },
          ],
          error: null,
        }),
      });

    repo = new MesaRepository(db);
    const resultado = await repo.updateConfirmacion("1", "doc1", "aceptado");

    expect(resultado).toBeDefined();
    expect(resultado.id).toBe("1");
  });

  it("debería manejar error cuando docente no está asignado en updateConfirmacion", async () => {
    const mockMesa = {
      id: "1",
      materia: "Matemática",
      fecha: "2025-01-01",
      hora: "10:00",
      aula: "A",
      estado: "pendiente",
      docente_titular: "doc1",
      docente_vocal: "doc2",
      docentes: [
        { id: "doc1", nombre: "Juan", confirmacion: "pendiente" },
        { id: "doc2", nombre: "Ana", confirmacion: "pendiente" },
      ],
    };

    db.from = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: [mockMesa], error: null }),
    });

    repo = new MesaRepository(db);

    await expect(
      repo.updateConfirmacion("1", "doc3", "aceptado")
    ).rejects.toThrow("El docente no está asignado a esta mesa");
  });

  it("debería manejar error cuando mesa no existe en updateConfirmacion", async () => {
    db.from = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: [], error: null }),
    });

    repo = new MesaRepository(db);

    await expect(
      repo.updateConfirmacion("inexistente", "doc1", "aceptado")
    ).rejects.toThrow("Mesa no encontrada");
  });

  it("debería confirmar mesa correctamente", async () => {
    const mockMesa = {
      id: "1",
      materia: "Matemática",
      fecha: "2025-01-01",
      hora: "10:00",
      aula: "A",
      estado: "confirmada",
      docente_titular: "doc1",
      docente_vocal: "doc2",
      docentes: [],
    };

    db.from = jest
      .fn()
      .mockReturnValueOnce({
        update: jest.fn().mockResolvedValue({ error: null }),
      })
      .mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({ data: [mockMesa], error: null }),
      });

    repo = new MesaRepository(db);
    const resultado = await repo.confirmarMesa("1");

    expect(resultado).toBeDefined();
    expect(resultado.id).toBe("1");
    expect(resultado.estado).toBe("confirmada");
  });

  it("debería manejar error cuando no encuentra mesa confirmada", async () => {
    db.from = jest
      .fn()
      .mockReturnValueOnce({
        update: jest.fn().mockResolvedValue({ error: null }),
      })
      .mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({ data: [], error: null }),
      });

    repo = new MesaRepository(db);

    await expect(repo.confirmarMesa("inexistente")).rejects.toThrow(
      "No se encontró la mesa actualizada"
    );
  });

  it("debería testear getInstance con db personalizada", () => {
    const customDb = { from: jest.fn() } as any;
    const instance1 = MesaRepository.getInstance(customDb);
    const instance2 = MesaRepository.getInstance();

    expect(instance1).toBe(instance2); // Singleton
  });
});

describe("Métodos privados de adaptación", () => {
  let repo: MesaRepository;
  beforeEach(() => {
    repo = new MesaRepository({} as any);
  });

  it("adaptMesaFromDB transforma correctamente los datos", () => {
    const dbMesa = {
      id: "1",
      materia: "Matemática",
      fecha: "2025-01-01",
      hora: "10:00",
      aula: "A",
      estado: "confirmada",
      docente_titular: "doc1",
      docente_vocal: "doc2",
      docentes: [{ id: "doc1" }, { id: "doc2" }],
      created_at: "2025-01-01",
      updated_at: "2025-01-01",
    };
    // @ts-ignore
    const mesa = repo["adaptMesaFromDB"](dbMesa);
    expect(mesa.id).toBe("1");
    expect(mesa.materia).toBe("Matemática");
    expect(mesa.docentes.length).toBe(2);
  });

  it("adaptMesaToDB transforma correctamente los datos", () => {
    const mesa = {
      id: "1",
      materia: "Matemática",
      fecha: "2025-01-01",
      hora: "10:00",
      aula: "A",
      docentes: [{ id: "doc1" }, { id: "doc2" }],
      estado: "confirmada",
    };
    // @ts-ignore
    const dbMesa = repo["adaptMesaToDB"](mesa);
    expect(dbMesa.id).toBe("1");
    expect(dbMesa.materia).toBe("Matemática");
    expect(dbMesa.docente_titular).toBe("doc1");
    expect(dbMesa.docente_vocal).toBe("doc2");
  });

  it("debería encontrar mesa por docente en array de docentes", async () => {
    const mockMesas = [
      {
        id: "mesa-1",
        docente_titular: "otroDocente",
        docente_vocal: "otroDocente2",
        docentes: [
          { id: "docente-test", nombre: "Test" },
          { id: "otro", nombre: "Otro" },
        ],
        materia: "Test",
      },
    ];

    const db = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: mockMesas,
          error: null,
        }),
      }),
    } as any;

    const repo = new MesaRepository(db);
    const result = await repo.getMesasByDocenteId("docente-test");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("mesa-1");
  });

  it("debería manejar error en updateMesa", async () => {
    const db = {
      from: jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: { message: "Update failed" },
          }),
        }),
      }),
    } as any;

    const repo = new MesaRepository(db);
    await expect(repo.updateMesa("1", { hora: "12:00" })).rejects.toThrow(
      "Update failed"
    );
  });

  it("debería manejar error en deleteMesa", async () => {
    const db = {
      from: jest.fn().mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: { message: "Delete failed" },
          }),
        }),
      }),
    } as any;

    const repo = new MesaRepository(db);
    await expect(repo.deleteMesa("1")).rejects.toThrow("Delete failed");
  });

  it("debería manejar error en confirmarMesa cuando no encuentra mesa", async () => {
    const db = {
      from: jest
        .fn()
        .mockReturnValueOnce({
          update: jest.fn().mockResolvedValue({ error: null }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockResolvedValue({
            data: [], // No encuentra mesa
            error: null,
          }),
        }),
    } as any;

    const repo = new MesaRepository(db);
    await expect(repo.confirmarMesa("inexistente")).rejects.toThrow(
      "No se encontró la mesa actualizada"
    );
  });

  it("debería validar fecha con menos de 48 horas de anticipación", async () => {
    const db = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: [], error: null }),
      }),
    } as any;

    const repo = new MesaRepository(db);

    const mañana = new Date();
    mañana.setDate(mañana.getDate() + 1); // Solo 24 horas después
    const fechaMañana = mañana.toISOString().split("T")[0];

    const mesaInvalida = {
      materia: "Matemática",
      fecha: fechaMañana,
      hora: "10:00",
      aula: "A",
      docentes: [
        { id: "1", nombre: "Juan" },
        { id: "2", nombre: "Ana" },
      ],
    };

    await expect(repo.createMesa(mesaInvalida as any)).rejects.toThrow(
      "La fecha de la mesa debe ser al menos 48 horas"
    );
  });
});
<<<<<<< HEAD
=======

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

describe("createMesa - validaciones adicionales", () => {
  let repository: MesaRepository;
  beforeEach(() => {
    repository = MesaRepository.getInstance(supabase);
  });

  it("debería rechazar una mesa sin materia", async () => {
    const nuevaMesa: Mesa = {
      id: "1",
      materia: "",
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

    await expect(repository.createMesa(nuevaMesa)).rejects.toThrow("La materia es obligatoria");
  });

  it("debería rechazar una mesa sin fecha", async () => {
    const nuevaMesa: Mesa = {
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

    await expect(repository.createMesa(nuevaMesa)).rejects.toThrow("La fecha es obligatoria");
  });

  it("debería rechazar una mesa con menos de dos docentes", async () => {
    const nuevaMesa: Mesa = {
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
      ],
    };

    await expect(repository.createMesa(nuevaMesa)).rejects.toThrow("Se requieren al menos dos docentes para una mesa");
  });

  it("debería rechazar una mesa con conflicto de horario", async () => {
    const nuevaMesa: Mesa = {
      id: "1",
      materia: "Matemática I",
      fecha: "2024-03-20",
      hora: "15:00",
      aula: "Aula 101",
      estado: "pendiente",
      docente_titular: "123",
      docente_vocal: "456",
      docentes: [
        { id: "123", nombre: "Docente 1", confirmacion: "pendiente" },
        { id: "456", nombre: "Docente 2", confirmacion: "pendiente" },
      ],
    };

    // Mock de mesas existentes con conflicto de horario
    supabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({
        data: [{
          id: "2",
          materia: "Otra Materia",
          fecha: "2024-03-20",
          hora: "16:00",
          aula: "Aula 102",
          estado: "pendiente",
          docente_titular: "123",
          docente_vocal: "789",
          docentes: [
            { id: "123", nombre: "Docente 1", confirmacion: "pendiente" },
            { id: "789", nombre: "Docente 3", confirmacion: "pendiente" },
          ],
        }],
        error: null,
      }),
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: [nuevaMesa], error: null }),
      }),
    });

    await expect(repository.createMesa(nuevaMesa)).rejects.toThrow("Conflicto de horario para el docente");
  });
});

describe("updateMesa - casos adicionales", () => {
  let repository: MesaRepository;
  beforeEach(() => {
    repository = MesaRepository.getInstance(supabase);
  });

  it("debería manejar el caso cuando la mesa no existe", async () => {
    supabase.from = jest.fn().mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
      select: jest.fn().mockResolvedValue({ data: [], error: null }),
    });

    const mesaActualizada: Partial<Mesa> = {
      aula: "Aula 102",
    };

    await expect(repository.updateMesa("999", mesaActualizada)).rejects.toThrow("No se encontró la mesa actualizada");
  });

  it("debería manejar errores en la consulta select después del update", async () => {
    supabase.from = jest.fn().mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
      select: jest.fn().mockResolvedValue({
        data: null,
        error: new Error("Error al obtener la mesa actualizada"),
      }),
    });

    const mesaActualizada: Partial<Mesa> = {
      aula: "Aula 102",
    };

    await expect(repository.updateMesa("1", mesaActualizada)).rejects.toThrow("Error al obtener la mesa actualizada");
  });
});

describe("getMesasByDocenteId - casos adicionales", () => {
  let repository: MesaRepository;
  beforeEach(() => {
    repository = MesaRepository.getInstance(supabase);
  });

  it("debería manejar el caso cuando no hay mesas", async () => {
    supabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: [], error: null }),
    });

    const mesas = await repository.getMesasByDocenteId("123");
    expect(mesas).toHaveLength(0);
  });

  it("debería manejar el caso cuando hay un error en la consulta", async () => {
    supabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({
        data: null,
        error: new Error("Error al obtener mesas"),
      }),
    });

    await expect(repository.getMesasByDocenteId("123")).rejects.toThrow("Error al obtener mesas");
  });
});
>>>>>>> origin/main
