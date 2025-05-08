import { MesaService } from "../MesaService";
import { ConsoleNotificacionStrategy } from "../../strategies/NotificacionStrategy";

describe("MesaService", () => {
  let mesaService: MesaService;
  let consoleStrategy: ConsoleNotificacionStrategy;

  beforeEach(() => {
    mesaService = MesaService.getInstance();
    consoleStrategy = new ConsoleNotificacionStrategy();
    mesaService.setNotificacionStrategy(consoleStrategy);
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
  });

  describe("enviarRecordatorio", () => {
    it("debería enviar un recordatorio sin errores", async () => {
      await expect(mesaService.enviarRecordatorio("M1")).resolves.not.toThrow();
    });
  });
});
