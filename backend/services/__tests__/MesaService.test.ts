import { jest } from '@jest/globals';
import { MesaService } from "../MesaService";
import {
  ConsoleNotificacionStrategy,
  PushNotificacionStrategy,
} from "../../strategies/NotificacionStrategy";
import { MesaRepository } from "../../repositories/MesaRepository";
import { Mesa, EstadoMesa, EstadoConfirmacion, Docente } from "../../types";

// Mock de PushNotificacionStrategy
jest.mock("../../strategies/NotificacionStrategy", () => {
  const originalModule = jest.requireActual(
    "../../strategies/NotificacionStrategy"
  );

  // Mock de enviar que no lanza errores
  const mockEnviar = jest.fn().mockImplementation(() => Promise.resolve(undefined));

  return Object.assign({}, originalModule, {
    PushNotificacionStrategy: {
      getInstance: jest.fn().mockReturnValue({
        enviar: mockEnviar,
        addSubscription: jest.fn(),
      }),
    },
  });
});

// Mock del repositorio
jest.mock("../../repositories/MesaRepository", () => {
  const mockMesa: Mesa = {
    id: "M1",
    materia: "Matemáticas",
    fecha: "2023-01-01",
    hora: "10:00",
    aula: "Aula 1",
    estado: "pendiente" as EstadoMesa,
    docente_titular: "123",
    docente_vocal: "456",
    docentes: [
      { id: "123", nombre: "Docente 1", confirmacion: "pendiente" as EstadoConfirmacion },
      { id: "456", nombre: "Docente 2", confirmacion: "pendiente" as EstadoConfirmacion },
    ],
  };

  return {
    MesaRepository: {
      getInstance: jest.fn().mockReturnValue({
        getMesasByDocenteId: jest.fn().mockImplementation(() => Promise.resolve([mockMesa])),
        updateConfirmacion: jest.fn((mesaId: string, docenteId: string, confirmacion: EstadoConfirmacion) => {
          const updatedDocentes = mockMesa.docentes.map(docente => 
            docente.id === docenteId 
              ? { ...docente, confirmacion } 
              : docente
          );
          return Promise.resolve({
            id: mockMesa.id,
            materia: mockMesa.materia,
            fecha: mockMesa.fecha,
            hora: mockMesa.hora,
            aula: mockMesa.aula,
            estado: mockMesa.estado,
            docente_titular: mockMesa.docente_titular,
            docente_vocal: mockMesa.docente_vocal,
            docentes: updatedDocentes,
          });
        }),
        getAllMesas: jest.fn().mockImplementation(() => Promise.resolve([mockMesa])),
        createMesa: jest.fn((mesa: Mesa) => {
          return Promise.resolve({
            id: "M-new",
            materia: mesa.materia,
            fecha: mesa.fecha,
            hora: mesa.hora,
            aula: mesa.aula,
            estado: mesa.estado,
            docente_titular: mesa.docente_titular,
            docente_vocal: mesa.docente_vocal,
            docentes: mesa.docentes,
          });
        }),
        updateMesa: jest.fn((mesaId: string, mesaActualizada: Partial<Mesa>) => {
          return Promise.resolve({
            id: mockMesa.id,
            materia: mesaActualizada.materia || mockMesa.materia,
            fecha: mesaActualizada.fecha || mockMesa.fecha,
            hora: mesaActualizada.hora || mockMesa.hora,
            aula: mesaActualizada.aula || mockMesa.aula,
            estado: mesaActualizada.estado || mockMesa.estado,
            docente_titular: mesaActualizada.docente_titular || mockMesa.docente_titular,
            docente_vocal: mesaActualizada.docente_vocal || mockMesa.docente_vocal,
            docentes: mesaActualizada.docentes || mockMesa.docentes,
          });
        }),
        deleteMesa: jest.fn().mockImplementation(() => Promise.resolve(undefined)),
      }),
    },
  };
});

// Mock de la estrategia de notificación
const mockEnviar = jest.fn().mockImplementation(() => Promise.resolve(undefined));
const mockConsoleStrategy = {
  enviar: mockEnviar,
};

// Espiar console.log para evitar ruido en los tests
beforeAll(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
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

    it("debería manejar errores al obtener mesas", async () => {
      const mockError = new Error("Error al obtener mesas");
      jest.spyOn(MesaRepository.getInstance(), "getMesasByDocenteId").mockRejectedValueOnce(mockError);
      await expect(mesaService.getMesasByDocenteId("123")).rejects.toThrow("Error al obtener mesas");
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

    it("debería manejar errores al confirmar una mesa", async () => {
      const mockError = new Error("Error al confirmar mesa");
      jest.spyOn(MesaRepository.getInstance(), "updateConfirmacion").mockRejectedValueOnce(mockError);
      await expect(mesaService.confirmarMesa("M1", "123", "aceptado")).rejects.toThrow("Error al confirmar mesa");
    });
  });

  describe("enviarRecordatorio", () => {
    it("debería enviar un recordatorio sin errores", async () => {
      await expect(mesaService.enviarRecordatorio("M1")).resolves.not.toThrow();
      expect(mockEnviar).toHaveBeenCalled();
    });

    it("debería manejar errores al enviar un recordatorio", async () => {
      const mockError = new Error("Error al enviar recordatorio");
      jest.spyOn(MesaRepository.getInstance(), "getAllMesas").mockRejectedValueOnce(mockError);
      await expect(mesaService.enviarRecordatorio("M1")).rejects.toThrow("Error al enviar recordatorio");
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
        estado: "pendiente" as EstadoMesa,
        docente_titular: "123",
        docente_vocal: "456",
        docentes: [
          { id: "123", nombre: "Docente 1", confirmacion: "pendiente" as EstadoConfirmacion },
          { id: "456", nombre: "Docente 2", confirmacion: "pendiente" as EstadoConfirmacion },
        ],
      };

      const mesa = await mesaService.createMesa(nuevaMesa);
      expect(mesa).toBeDefined();
      expect(mesa.id).toBe("M-new");
    });

    it("debería manejar errores al crear una mesa", async () => {
      const mockError = new Error("Error al crear mesa");
      jest.spyOn(MesaRepository.getInstance(), "createMesa").mockRejectedValueOnce(mockError);
      const nuevaMesa: Mesa = {
        id: "",
        materia: "Nueva Materia",
        fecha: "2023-01-01",
        hora: "10:00",
        aula: "Aula 1",
        estado: "pendiente" as EstadoMesa,
        docente_titular: "123",
        docente_vocal: "456",
        docentes: [
          { id: "123", nombre: "Docente 1", confirmacion: "pendiente" as EstadoConfirmacion },
          { id: "456", nombre: "Docente 2", confirmacion: "pendiente" as EstadoConfirmacion },
        ],
      };
      await expect(mesaService.createMesa(nuevaMesa)).rejects.toThrow("Error al crear mesa");
    });
  });

  describe("updateMesa", () => {
    it("debería actualizar una mesa correctamente", async () => {
      const mesaActualizada: Partial<Mesa> = {
        estado: "confirmada" as EstadoMesa,
      };

      const mesa = await mesaService.updateMesa("M1", mesaActualizada);
      expect(mesa).toBeDefined();
      expect(mesa.estado).toBe("confirmada");
    });

    it("debería actualizar una mesa a pendiente correctamente", async () => {
      const mesaActualizada: Partial<Mesa> = {
        estado: "pendiente" as EstadoMesa,
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
      expect(mesa.aula).toBe("Aula Nueva"); // El mock actualiza el campo si se lo pasan
    });

    it("debería manejar errores al actualizar una mesa", async () => {
      const mockError = new Error("Error al actualizar mesa");
      jest.spyOn(MesaRepository.getInstance(), "updateMesa").mockRejectedValueOnce(mockError);
      const mesaActualizada: Partial<Mesa> = {
        estado: "confirmada" as EstadoMesa,
      };
      await expect(mesaService.updateMesa("M1", mesaActualizada)).rejects.toThrow("Error al actualizar mesa");
    });
  });

  describe("deleteMesa", () => {
    it("debería eliminar una mesa sin errores", async () => {
      await expect(mesaService.deleteMesa("M1")).resolves.not.toThrow();
    });

    it("debería manejar errores al eliminar una mesa", async () => {
      const mockError = new Error("Error al eliminar mesa");
      jest.spyOn(MesaRepository.getInstance(), "deleteMesa").mockRejectedValueOnce(mockError);
      await expect(mesaService.deleteMesa("M1")).rejects.toThrow("Error al eliminar mesa");
    });
  });

  describe("getAllMesas", () => {
    it("debería obtener todas las mesas", async () => {
      const mesas = await mesaService.getAllMesas();
      expect(mesas).toBeDefined();
      expect(Array.isArray(mesas)).toBe(true);
      expect(mesas.length).toBeGreaterThan(0);
    });

    it("debería manejar errores al obtener todas las mesas", async () => {
      const mockError = new Error("Error al obtener todas las mesas");
      jest.spyOn(MesaRepository.getInstance(), "getAllMesas").mockRejectedValueOnce(mockError);
      await expect(mesaService.getAllMesas()).rejects.toThrow("Error al obtener todas las mesas");
    });
  });
});
