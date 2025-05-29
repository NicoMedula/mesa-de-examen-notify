import { MesaService } from "../MesaService";
import {
  ConsoleNotificacionStrategy,
  PushNotificacionStrategy,
} from "../../strategies/NotificacionStrategy";
import { MesaRepository } from "../../repositories/MesaRepository";
import { Mesa } from "../../types";

// Mock de PushNotificacionStrategy
jest.mock("../../strategies/NotificacionStrategy", () => {
  const originalModule = jest.requireActual(
    "../../strategies/NotificacionStrategy"
  );

  // Mock de enviar que no lanza errores
  const mockEnviar = jest.fn().mockResolvedValue(undefined);

  return {
    ...originalModule,
    PushNotificacionStrategy: {
      getInstance: jest.fn().mockReturnValue({
        enviar: mockEnviar,
        addSubscription: jest.fn(),
      }),
    },
  };
});

// Mock del repositorio
jest.mock("../../repositories/MesaRepository", () => {
  return {
    MesaRepository: {
      getInstance: jest.fn().mockReturnValue({
        getMesasByDocenteId: jest.fn().mockResolvedValue([
          {
            id: "M1",
            materia: "Matemáticas",
            fecha: "2023-01-01",
            hora: "10:00",
            aula: "Aula 1",
            estado: "pendiente",
            docente_titular: "123",
            docente_vocal: "456",
            docentes: [
              { id: "123", nombre: "Docente 1", confirmacion: "pendiente" },
              { id: "456", nombre: "Docente 2", confirmacion: "pendiente" },
            ],
          },
        ]),
        updateConfirmacion: jest
          .fn()
          .mockImplementation((mesaId, docenteId, confirmacion) => {
            return Promise.resolve({
              id: mesaId,
              materia: "Matemáticas",
              fecha: "2023-01-01",
              hora: "10:00",
              aula: "Aula 1",
              estado: "pendiente",
              docente_titular: "123",
              docente_vocal: "456",
              docentes: [
                {
                  id: "123",
                  nombre: "Docente 1",
                  confirmacion:
                    docenteId === "123" ? confirmacion : "pendiente",
                },
                {
                  id: "456",
                  nombre: "Docente 2",
                  confirmacion:
                    docenteId === "456" ? confirmacion : "pendiente",
                },
              ],
            });
          }),
        getAllMesas: jest.fn().mockResolvedValue([
          {
            id: "M1",
            materia: "Matemáticas",
            fecha: "2023-01-01",
            hora: "10:00",
            aula: "Aula 1",
            estado: "pendiente",
            docente_titular: "123",
            docente_vocal: "456",
            docentes: [
              { id: "123", nombre: "Docente 1", confirmacion: "pendiente" },
              { id: "456", nombre: "Docente 2", confirmacion: "pendiente" },
            ],
          },
        ]),
        createMesa: jest.fn().mockImplementation((mesa: Mesa) => {
          return Promise.resolve({
            ...mesa,
            id: "M-new",
          });
        }),
        updateMesa: jest
          .fn()
          .mockImplementation(
            (mesaId: string, mesaActualizada: Partial<Mesa>) => {
              return Promise.resolve({
                id: mesaId,
                materia: "Matemáticas",
                fecha: "2023-01-01",
                hora: "10:00",
                aula: "Aula 1",
                estado: mesaActualizada.estado || "pendiente",
                docente_titular: "123",
                docente_vocal: "456",
                docentes: [
                  { id: "123", nombre: "Docente 1", confirmacion: "pendiente" },
                  { id: "456", nombre: "Docente 2", confirmacion: "pendiente" },
                ],
              });
            }
          ),
        deleteMesa: jest.fn().mockResolvedValue(undefined),
      }),
    },
  };
});

// Mock de la estrategia de notificación
const mockEnviar = jest.fn().mockResolvedValue(undefined);
const mockConsoleStrategy = {
  enviar: mockEnviar,
};

// Espiar console.log para evitar ruido en los tests
beforeAll(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe("MesaService", () => {
  let mesaService: MesaService;

  beforeEach(() => {
    // Limpiar mocks
    jest.clearAllMocks();

    // Obtener instancia del servicio
    mesaService = MesaService.getInstance();

    // Inyectar la estrategia mock
    mesaService.setNotificacionStrategy(mockConsoleStrategy as any);
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
      expect(mockEnviar).toHaveBeenCalled();
    });

    it("debería rechazar una mesa correctamente", async () => {
      const mesa = await mesaService.confirmarMesa("M1", "123", "rechazado");
      expect(mesa).toBeDefined();
      const docente = mesa.docentes.find((d) => d.id === "123");
      expect(docente?.confirmacion).toBe("rechazado");
      expect(mockEnviar).toHaveBeenCalled();
    });
  });

  describe("enviarRecordatorio", () => {
    it("debería enviar un recordatorio sin errores", async () => {
      await expect(mesaService.enviarRecordatorio("M1")).resolves.not.toThrow();
      expect(mockEnviar).toHaveBeenCalled();
    });
  });

  describe("createMesa", () => {
    it("debería crear una mesa correctamente", async () => {
      const nuevaMesa: Mesa = {
        id: "",
        materia: "Nueva Materia",
        fecha: "2023-01-01",
        hora: "10:00",
        aula: "Aula 1",
        estado: "pendiente",
        docente_titular: "123",
        docente_vocal: "456",
        docentes: [
          { id: "123", nombre: "Docente 1", confirmacion: "pendiente" },
          { id: "456", nombre: "Docente 2", confirmacion: "pendiente" },
        ],
      };

      const mesa = await mesaService.createMesa(nuevaMesa);
      expect(mesa).toBeDefined();
      expect(mesa.id).toBe("M-new");
    });
  });

  describe("updateMesa", () => {
    it("debería actualizar una mesa correctamente", async () => {
      const mesaActualizada: Partial<Mesa> = {
        estado: "confirmada",
      };

      const mesa = await mesaService.updateMesa("M1", mesaActualizada);
      expect(mesa).toBeDefined();
      expect(mesa.estado).toBe("confirmada");
    });

    it("debería actualizar una mesa a pendiente correctamente", async () => {
      const mesaActualizada: Partial<Mesa> = {
        estado: "pendiente",
      };

      const mesa = await mesaService.updateMesa("M1", mesaActualizada);
      expect(mesa).toBeDefined();
      expect(mesa.estado).toBe("pendiente");
    });

    it("debería actualizar una mesa sin cambiar estado", async () => {
      const mesaActualizada: Partial<Mesa> = {
        aula: "Aula Nueva",
      };

      const mesa = await mesaService.updateMesa("M1", mesaActualizada);
      expect(mesa).toBeDefined();
      expect(mesa.aula).toBe("Aula 1"); // No cambia porque el mock siempre devuelve lo mismo
    });
  });

  describe("deleteMesa", () => {
    it("debería eliminar una mesa sin errores", async () => {
      await expect(mesaService.deleteMesa("M1")).resolves.not.toThrow();
    });
  });

  describe("getAllMesas", () => {
    it("debería obtener todas las mesas", async () => {
      const mesas = await mesaService.getAllMesas();
      expect(mesas).toBeDefined();
      expect(Array.isArray(mesas)).toBe(true);
      expect(mesas.length).toBeGreaterThan(0);
    });
  });
});
