import { MesaRepository } from "../MesaRepository";
import * as fs from "fs";
import * as path from "path";

describe("MesaRepository", () => {
  let repo: MesaRepository;
  const dataPath = path.join(__dirname, "../../data/mesas.json");
  let originalData: string;

  beforeAll(() => {
    originalData = fs.readFileSync(dataPath, "utf-8");
  });

  afterAll(() => {
    fs.writeFileSync(dataPath, originalData);
  });

  beforeEach(() => {
    repo = MesaRepository.getInstance();
  });

  it("debería lanzar error si la mesa no existe", () => {
    expect(() =>
      repo.updateConfirmacion("NO_EXISTE", "123", "aceptado")
    ).toThrow("Mesa no encontrada");
  });

  it("debería lanzar error si el docente no existe en la mesa", () => {
    expect(() =>
      repo.updateConfirmacion("M1", "NO_EXISTE", "aceptado")
    ).toThrow("Docente no encontrado en la mesa");
  });
  it("debería actualizar de rechazado a aceptado el estado del docente '123' en la mesa 'M1'", () => {
  const mesaId = "M1";
  const docenteId = "123";
  const confirmacion = "aceptado";

  const mesa = repo.updateConfirmacion(mesaId, docenteId, confirmacion);

  const docenteActualizado = mesa.docentes.find((d) => d.id === docenteId);

  expect(docenteActualizado?.confirmacion).toBe("aceptado");
});

it("no debería cambiar el estado si ya está confirmado como 'aceptado'", () => {
  const mesaId = "M1";
  const docenteId = "456";
  const confirmacion = "aceptado";

  const mesaAntes = repo.updateConfirmacion(mesaId, docenteId, confirmacion);
  const docenteAntes = mesaAntes.docentes.find((d) => d.id === docenteId);

  expect(docenteAntes?.confirmacion).toBe("aceptado");
});

it("debería devolver todas las mesas donde participa el docente '123'", () => {
  const mesas = repo.getMesasByDocenteId("123");

  const ids = mesas.map((m) => m.id);
  expect(ids).toContain("M1");
  expect(ids).toContain("M2");
  expect(mesas.length).toBe(2);
});




});
