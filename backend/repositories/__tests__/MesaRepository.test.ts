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
});
