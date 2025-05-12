import { MesaService } from "../MesaService";
import {
  ConsoleNotificacionStrategy,
  NotificacionStrategy,
} from "../../strategies/NotificacionStrategy";
import mesasData from "../../data/mesas.json"; // ✅ importar JSON correctamente
import * as fs from "fs";                      // ✅ importar módulos correctamente
import * as path from "path";                  // ✅ importar módulos correctamente

describe("MesaService", () => {
  let mesaService: MesaService;
  let consoleStrategy: ConsoleNotificacionStrategy;
  let mockNotificacionStrategy: NotificacionStrategy;

  beforeEach(() => {
    mesaService = MesaService.getInstance();
    consoleStrategy = new ConsoleNotificacionStrategy();
    mesaService.setNotificacionStrategy(consoleStrategy);
    // Creamos un mock para la estrategia de notificación
    mockNotificacionStrategy = {
      enviar: jest.fn().mockResolvedValue(undefined),
    };
    mesaService.setNotificacionStrategy(mockNotificacionStrategy);
  });

  describe("getMesasByDocenteId", () => {
    it("debería retornar las mesas de un docente específico", async () => {
      const mesas = await mesaService.getMesasByDocenteId("123");
      expect(mesas).toBeDefined();
      expect(Array.isArray(mesas)).toBe(true);
      expect(
        mesas.every((mesa) =>
          mesa.docentes.some((docente) => docente.id === "123")
        )
      ).toBe(true);
    });
  });

  describe("confirmarMesa", () => {
    it("debería confirmar una mesa correctamente", async () => {
      const mesa = await mesaService.confirmarMesa("M1", "123", "aceptado");
      expect(mesa).toBeDefined();
      const docente = mesa.docentes.find((d) => d.id === "123");
      expect(docente?.confirmacion).toBe("aceptado");
    });

    it("debería rechazar una mesa correctamente", async () => {
      const mesa = await mesaService.confirmarMesa("M1", "123", "rechazado");
      expect(mesa).toBeDefined();
      const docente = mesa.docentes.find((d) => d.id === "123");
      expect(docente?.confirmacion).toBe("rechazado");
    });

    it("debería lanzar error si la mesa es en menos de 48 horas", async () => {
      const mesas = JSON.parse(JSON.stringify(mesasData)); // Clonamos para no afectar el import
      mesas.mesas.push({
        id: "M3",
        fecha: new Date(Date.now() + 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10),
        hora: new Date().toTimeString().slice(0, 5),
        ubicacion: "Aula 10",
        docentes: [
          { id: "123", nombre: "Prof. Test", confirmacion: "pendiente" },
        ],
      });

      fs.writeFileSync(
        path.join(__dirname, "../../data/mesas.json"),
        JSON.stringify(mesas, null, 2)
      );

      await expect(
        mesaService.confirmarMesa("M3", "123", "aceptado")
      ).rejects.toThrow(
        "La mesa debe confirmarse con al menos 48 horas de anticipación."
      );
    });

    it("debería llamar a la estrategia de notificación al confirmar una mesa", async () => {
      await mesaService.confirmarMesa("M1", "123", "aceptado");
      expect(mockNotificacionStrategy.enviar).toHaveBeenCalled();
    });
  });

  describe("enviarRecordatorio", () => {
    it("debería enviar un recordatorio sin errores", async () => {
      await expect(mesaService.enviarRecordatorio("M1")).resolves.not.toThrow();
    });
  });
});
