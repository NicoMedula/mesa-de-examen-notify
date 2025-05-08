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
});
