import { MesaRepository } from "../MesaRepository";

describe("MesaRepository", () => {
  let repo: MesaRepository;
  let db: any;

  beforeEach(() => {

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

      docentes: [
        { id: "1", nombre: "Juan" },
        { id: "2", nombre: "Ana" },
      ],
    };
    await expect(repo.createMesa(mesa as any)).resolves.toBeDefined();
  });


  it("debería lanzar error si la materia es obligatoria", async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    const fecha = futureDate.toISOString().split("T")[0];
    const mesa = {
      fecha,
      hora: "10:00",
      aula: "A",

      docentes: [
        { id: "1", nombre: "Juan" },
        { id: "2", nombre: "Ana" },
      ],
    };

    await expect(repo.createMesa(mesa as any)).rejects.toThrow(

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

  it("debería manejar error al verificar mesas existentes en createMesa", async () => {
    db.from = jest
      .fn()
      .mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({ data: [], error: null }),

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

