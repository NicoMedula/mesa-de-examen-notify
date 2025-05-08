import { Mesa, MesasData } from "../types";
import * as fs from "fs";
import * as path from "path";

// Patrón Singleton: Garantiza una única instancia de MesaRepository
// Patrón Repository: Encapsula el acceso a los datos de mesas
export class MesaRepository {
  private static instance: MesaRepository;
  private readonly dataPath: string;

  private constructor() {
    this.dataPath = path.join(__dirname, "../data/mesas.json");
    // console.log("Ruta de mesas.json:", this.dataPath); // LOG de ruta
  }

  public static getInstance(): MesaRepository {
    if (!MesaRepository.instance) {
      MesaRepository.instance = new MesaRepository();
    }

    return MesaRepository.instance;
  }

  private readData(): MesasData {
    const data = fs.readFileSync(this.dataPath, "utf-8");
    // console.log("Contenido bruto leído:", data); // LOG de contenido
    return JSON.parse(data);
  }

  private writeData(data: MesasData): void {
    fs.writeFileSync(this.dataPath, JSON.stringify(data, null, 2));
  }

  public getAllMesas(): Mesa[] {
    const mesas = this.readData().mesas;
    // console.log("Mesas leídas:", mesas); // LOG de mesas
    return mesas;
  }

  public getMesasByDocenteId(docenteId: string): Mesa[] {
    const mesas = this.getAllMesas();
    const filtradas = mesas.filter((mesa) =>
      mesa.docentes.some((docente) => docente.id === docenteId)
    );
    // console.log(`Buscando mesas para docente ${docenteId}:`, filtradas); // LOG de búsqueda
    return filtradas;
  }

  public updateConfirmacion(
    mesaId: string,
    docenteId: string,
    confirmacion: "aceptado" | "rechazado"
  ): Mesa {
    const data = this.readData();
    const mesa = data.mesas.find((m) => m.id === mesaId);

    if (!mesa) {
      throw new Error("Mesa no encontrada");
    }

    const docente = mesa.docentes.find((d) => d.id === docenteId);
    if (!docente) {
      throw new Error("Docente no encontrado en la mesa");
    }

    docente.confirmacion = confirmacion;
    this.writeData(data);
    return mesa;
  }
}
