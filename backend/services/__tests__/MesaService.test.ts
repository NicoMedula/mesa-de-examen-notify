import { jest } from '@jest/globals';
import { MesaService } from "../MesaService";
import { MesaRepository } from "../../repositories/MesaRepository";
import { NotificacionFactory } from "../../factories/NotificacionFactory";
import {
  WebSocketNotificacionStrategy,
  PushNotificacionStrategy,
} from "../../strategies/NotificacionStrategy";
<<<<<<< HEAD

jest.mock("../../repositories/MesaRepository");
jest.mock("../../factories/NotificacionFactory");
jest.mock("../../strategies/NotificacionStrategy");
=======
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
>>>>>>> origin/main

describe("MesaService", () => {
  let mesaService: MesaService;
  let mockRepo: any;
  let mockStrategy: any;

  beforeEach(() => {
    // Limpiar instancias singleton para cada test
    (MesaService as any).instance = undefined;
    (WebSocketNotificacionStrategy as any).instance = undefined;
    (PushNotificacionStrategy as any).instance = undefined;

    mockRepo = {
      getMesasByDocenteId: jest.fn(),
      updateConfirmacion: jest.fn(),
      getAllMesas: jest.fn(),
      createMesa: jest.fn(),
      updateMesa: jest.fn(),
      deleteMesa: jest.fn(),
    };
    (MesaRepository.getInstance as jest.Mock).mockReturnValue(mockRepo);
    mockStrategy = { enviar: jest.fn() };
    mesaService = new MesaService(mockStrategy);
  });

<<<<<<< HEAD
  it("debería obtener mesas por docente", async () => {
    mockRepo.getMesasByDocenteId.mockResolvedValue(["mesa1"]);
    const result = await mesaService.getMesasByDocenteId("doc1");
    expect(result).toEqual(["mesa1"]);
=======
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
>>>>>>> origin/main
  });

  it("debería confirmar mesa y notificar", async () => {
    const mesa = {
      docentes: [
        { id: "d1", confirmacion: "aceptado", nombre: "Docente1" },
        { id: "d2", confirmacion: "aceptado", nombre: "Docente2" },
      ],
      id: "m1",
    };
    mockRepo.updateConfirmacion.mockResolvedValue(mesa);
    (
      NotificacionFactory.crearNotificacionConfirmacion as jest.Mock
    ).mockReturnValue({
      mensaje: "msg",
      tipo: "confirmacion",
      timestamp: new Date(),
    });
    (
      NotificacionFactory.crearNotificacionActualizacion as jest.Mock
    ).mockReturnValue({
      mensaje: "actualizacion",
      tipo: "actualizacion",
      timestamp: new Date(),
    });
<<<<<<< HEAD
    (PushNotificacionStrategy.getInstance as jest.Mock).mockReturnValue({
      enviar: jest.fn(),
    });
    const result = await mesaService.confirmarMesa("m1", "d1", "aceptado");
    expect(result).toBe(mesa);
    expect(mockStrategy.enviar).toHaveBeenCalled();
  });

  it("debería manejar error en confirmarMesa", async () => {
    mockRepo.updateConfirmacion.mockRejectedValue(new Error("fail"));
    await expect(
      mesaService.confirmarMesa("m1", "d1", "aceptado")
    ).rejects.toThrow("fail");
  });

  it("debería crear una mesa y notificar a los docentes", async () => {
    const mesa = {
      docentes: [
        { id: "d1", nombre: "Doc1" },
        { id: "d2", nombre: "Doc2" },
      ],
      id: "m1",
      fecha: "2025-01-01",
      hora: "10:00",
      aula: "A",
    };
    mockRepo.createMesa.mockResolvedValue(mesa);
    (
      NotificacionFactory.crearNotificacionActualizacion as jest.Mock
    ).mockReturnValue({
      mensaje: "msg",
      tipo: "actualizacion",
      timestamp: new Date(),
    });
    (PushNotificacionStrategy.getInstance as jest.Mock).mockReturnValue({
      enviar: jest.fn(),
    });
    const result = await mesaService.createMesa(mesa as any);
    expect(result).toBe(mesa);
  });

  it("debería actualizar una mesa", async () => {
    const mesa = {
      id: "m1",
      docentes: [],
      fecha: "2025-01-01",
      hora: "10:00",
      aula: "A",
    };
    mockRepo.updateMesa.mockResolvedValue(mesa);
    const result = await mesaService.updateMesa("m1", { estado: "confirmada" });
    expect(result).toBe(mesa);
  });

  it("debería crear instancia singleton sin estrategia", () => {
    (WebSocketNotificacionStrategy.getInstance as jest.Mock).mockReturnValue(
      mockStrategy
    );
    const instance = MesaService.getInstance();
    expect(instance).toBeInstanceOf(MesaService);
    expect(WebSocketNotificacionStrategy.getInstance).toHaveBeenCalled();
  });

  it("debería crear instancia singleton con estrategia", () => {
    const customStrategy = { enviar: jest.fn() };
    const instance = MesaService.getInstance(customStrategy as any);
    expect(instance).toBeInstanceOf(MesaService);
  });

  it("debería permitir cambiar estrategia de notificación", () => {
    const nuevaEstrategia = { enviar: jest.fn() };
    mesaService.setNotificacionStrategy(nuevaEstrategia as any);
    // El método debe ejecutarse sin errores
    expect(true).toBe(true);
  });

  it("debería notificar cuando ambos docentes aceptan", async () => {
    const mesa = {
      docentes: [
        { id: "d1", confirmacion: "aceptado", nombre: "Docente1" },
        { id: "d2", confirmacion: "aceptado", nombre: "Docente2" },
      ],
      id: "m1",
    };
    mockRepo.updateConfirmacion.mockResolvedValue(mesa);

    const mockPushStrategy = { enviar: jest.fn() };
    (PushNotificacionStrategy.getInstance as jest.Mock).mockReturnValue(
      mockPushStrategy
    );
    (
      NotificacionFactory.crearNotificacionConfirmacion as jest.Mock
    ).mockReturnValue({
      mensaje: "confirmacion",
      tipo: "confirmacion",
      timestamp: new Date(),
    });
    (
      NotificacionFactory.crearNotificacionActualizacion as jest.Mock
    ).mockReturnValue({
      mensaje: "actualizacion",
      tipo: "actualizacion",
      timestamp: new Date(),
    });

    await mesaService.confirmarMesa("m1", "d1", "aceptado");

    // Debe haber llamado a PushNotificacionStrategy dos veces (docentes + departamento)
    expect(mockPushStrategy.enviar).toHaveBeenCalledTimes(2);
  });

  it("debería notificar cuando un docente rechaza", async () => {
    const mesa = {
      docentes: [
        { id: "d1", confirmacion: "rechazado", nombre: "Docente1" },
        { id: "d2", confirmacion: "pendiente", nombre: "Docente2" },
      ],
      id: "m1",
    };
    mockRepo.updateConfirmacion.mockResolvedValue(mesa);

    const mockPushStrategy = { enviar: jest.fn() };
    (PushNotificacionStrategy.getInstance as jest.Mock).mockReturnValue(
      mockPushStrategy
    );
    (
      NotificacionFactory.crearNotificacionConfirmacion as jest.Mock
    ).mockReturnValue({
      mensaje: "confirmacion",
      tipo: "confirmacion",
      timestamp: new Date(),
    });
    (
      NotificacionFactory.crearNotificacionActualizacion as jest.Mock
    ).mockReturnValue({
      mensaje: "actualizacion",
      tipo: "actualizacion",
      timestamp: new Date(),
    });

    await mesaService.confirmarMesa("m1", "d1", "rechazado");

    // Debe haber notificado al otro docente y al departamento
    expect(mockPushStrategy.enviar).toHaveBeenCalledTimes(2);
  });

  it("debería actualizar mesa y notificar cuando estado es confirmada", async () => {
    const mesa = {
      id: "m1",
      docentes: [
        { id: "d1", nombre: "Docente1" },
        { id: "d2", nombre: "Docente2" },
      ],
      fecha: "2025-01-01",
      hora: "10:00",
      aula: "A",
    };
    mockRepo.updateMesa.mockResolvedValue(mesa);

    const mockPushStrategy = { enviar: jest.fn() };
    (PushNotificacionStrategy.getInstance as jest.Mock).mockReturnValue(
      mockPushStrategy
    );
    (
      NotificacionFactory.crearNotificacionActualizacion as jest.Mock
    ).mockReturnValue({
      mensaje: "actualizacion",
      tipo: "actualizacion",
      timestamp: new Date(),
    });

    await mesaService.updateMesa("m1", { estado: "confirmada" });

    // Debe haber notificado a ambos docentes
    expect(mockPushStrategy.enviar).toHaveBeenCalledTimes(2);
  });

  it("debería actualizar mesa y notificar cuando estado es pendiente", async () => {
    const mesa = {
      id: "m1",
      docentes: [
        { id: "d1", nombre: "Docente1" },
        { id: "d2", nombre: "Docente2" },
      ],
      fecha: "2025-01-01",
      hora: "10:00",
      aula: "A",
    };
    mockRepo.updateMesa.mockResolvedValue(mesa);

    const mockPushStrategy = { enviar: jest.fn() };
    (PushNotificacionStrategy.getInstance as jest.Mock).mockReturnValue(
      mockPushStrategy
    );
    (
      NotificacionFactory.crearNotificacionActualizacion as jest.Mock
    ).mockReturnValue({
      mensaje: "actualizacion",
      tipo: "actualizacion",
      timestamp: new Date(),
    });

    await mesaService.updateMesa("m1", { estado: "pendiente" });

    // Debe haber notificado a ambos docentes
    expect(mockPushStrategy.enviar).toHaveBeenCalledTimes(2);
  });

  it("debería eliminar una mesa", async () => {
    mockRepo.deleteMesa.mockResolvedValue(undefined);
    await mesaService.deleteMesa("m1");
    expect(mockRepo.deleteMesa).toHaveBeenCalledWith("m1");
  });

  it("debería obtener todas las mesas", async () => {
    const mesas = [{ id: "m1" }, { id: "m2" }];
    mockRepo.getAllMesas.mockResolvedValue(mesas);
    const result = await mesaService.getAllMesas();
    expect(result).toBe(mesas);
    expect(mockRepo.getAllMesas).toHaveBeenCalled();
  });

  // Test adicional para branch coverage: cuando no se encuentra el docente (línea 53)
  it("debería manejar caso donde docente no se encuentra en la mesa", async () => {
    const mesa = {
      docentes: [
        { id: "d2", confirmacion: "pendiente", nombre: "Docente2" },
        { id: "d3", confirmacion: "pendiente", nombre: "Docente3" },
      ],
      id: "m1",
    };
    mockRepo.updateConfirmacion.mockResolvedValue(mesa);
    (
      NotificacionFactory.crearNotificacionConfirmacion as jest.Mock
    ).mockReturnValue({
      mensaje: "confirmacion",
      tipo: "confirmacion",
      timestamp: new Date(),
    });

    await mesaService.confirmarMesa("m1", "d1", "aceptado"); // d1 no está en la mesa

    // No debe enviar notificación porque el docente no está en la mesa
    expect(mockStrategy.enviar).not.toHaveBeenCalled();
  });

  // Test para cubrir updateMesa sin estado específico (sin notificación)
  it("debería actualizar mesa sin notificar cuando no cambia estado específico", async () => {
    const mesa = {
      id: "m1",
      docentes: [
        { id: "d1", nombre: "Docente1" },
        { id: "d2", nombre: "Docente2" },
      ],
      fecha: "2025-01-01",
      hora: "10:00",
      aula: "A",
    };
    mockRepo.updateMesa.mockResolvedValue(mesa);

    const mockPushStrategy = { enviar: jest.fn() };
    (PushNotificacionStrategy.getInstance as jest.Mock).mockReturnValue(
      mockPushStrategy
    );

    await mesaService.updateMesa("m1", { hora: "14:00" }); // Sin cambio de estado

    // No debe haber enviado notificaciones push porque no cambió el estado
    expect(mockPushStrategy.enviar).not.toHaveBeenCalled();
  });

  // Test adicional para cubrir branch donde NO ambos docentes han aceptado
  it("debería manejar cuando NO ambos docentes han aceptado", async () => {
    const mesa = {
      docentes: [
        { id: "d1", confirmacion: "aceptado", nombre: "Docente1" },
        { id: "d2", confirmacion: "pendiente", nombre: "Docente2" }, // UNO pendiente
      ],
      id: "m1",
    };
    mockRepo.updateConfirmacion.mockResolvedValue(mesa);

    const mockPushStrategy = { enviar: jest.fn() };
    (PushNotificacionStrategy.getInstance as jest.Mock).mockReturnValue(
      mockPushStrategy
    );
    (
      NotificacionFactory.crearNotificacionConfirmacion as jest.Mock
    ).mockReturnValue({
      mensaje: "confirmacion",
      tipo: "confirmacion",
      timestamp: new Date(),
    });

    await mesaService.confirmarMesa("m1", "d1", "aceptado");

    // NO debe haber llamado a PushNotificacionStrategy porque no ambos aceptaron
    expect(mockPushStrategy.enviar).not.toHaveBeenCalled();
    // Pero sí debe haber enviado la notificación regular
    expect(mockStrategy.enviar).toHaveBeenCalled();
  });

  // Test para cubrir cuando confirmacion NO es "rechazado"
  it("debería manejar confirmación que no es rechazado (pendiente/aceptado)", async () => {
    const mesa = {
      docentes: [
        { id: "d1", confirmacion: "pendiente", nombre: "Docente1" },
        { id: "d2", confirmacion: "pendiente", nombre: "Docente2" },
      ],
      id: "m1",
    };
    mockRepo.updateConfirmacion.mockResolvedValue(mesa);

    const mockPushStrategy = { enviar: jest.fn() };
    (PushNotificacionStrategy.getInstance as jest.Mock).mockReturnValue(
      mockPushStrategy
    );
    (
      NotificacionFactory.crearNotificacionConfirmacion as jest.Mock
    ).mockReturnValue({
      mensaje: "confirmacion",
      tipo: "confirmacion",
      timestamp: new Date(),
    });

    await mesaService.confirmarMesa("m1", "d1", "pendiente"); // NO es "rechazado"

    // No debe entrar en el bloque de rechazo
    expect(mockPushStrategy.enviar).not.toHaveBeenCalled();
=======

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

    it("debería enviar notificaciones push al actualizar una mesa a confirmada", async () => {
      const mesaActualizada: Partial<Mesa> = {
        estado: "confirmada" as EstadoMesa,
      };
      await mesaService.updateMesa("M1", mesaActualizada);
      expect(mockEnviar).toHaveBeenCalled();
    });

    it("debería enviar notificaciones push al actualizar una mesa a pendiente", async () => {
      const mesaActualizada: Partial<Mesa> = {
        estado: "pendiente" as EstadoMesa,
      };
      await mesaService.updateMesa("M1", mesaActualizada);
      expect(mockEnviar).toHaveBeenCalled();
    });
  });

  describe("deleteMesa", () => {
    it("debería eliminar una mesa correctamente", async () => {
      await expect(mesaService.deleteMesa("M1")).resolves.not.toThrow();
    });

    it("debería manejar errores al eliminar una mesa", async () => {
      const mockError = new Error("Error al eliminar mesa");
      jest.spyOn(MesaRepository.getInstance(), "deleteMesa").mockRejectedValueOnce(mockError);
      await expect(mesaService.deleteMesa("M1")).rejects.toThrow("Error al eliminar mesa");
    });
  });

  describe("getAllMesas", () => {
    it("debería obtener todas las mesas correctamente", async () => {
      const mesas = await mesaService.getAllMesas();
      expect(mesas).toBeDefined();
      expect(Array.isArray(mesas)).toBe(true);
      expect(mesas.length).toBeGreaterThan(0);
    });

    it("debería manejar errores al obtener todas las mesas", async () => {
      const mockError = new Error("Error al obtener mesas");
      jest.spyOn(MesaRepository.getInstance(), "getAllMesas").mockRejectedValueOnce(mockError);
      await expect(mesaService.getAllMesas()).rejects.toThrow("Error al obtener mesas");
    });
  });

  describe("confirmarMesa - casos adicionales", () => {
    it("debería enviar notificaciones cuando ambos docentes aceptan", async () => {
      // Primera confirmación
      await mesaService.confirmarMesa("M1", "123", "aceptado");
      // Segunda confirmación
      await mesaService.confirmarMesa("M1", "456", "aceptado");
      expect(mockEnviar).toHaveBeenCalledTimes(2);
    });

    it("debería enviar notificaciones cuando un docente rechaza", async () => {
      await mesaService.confirmarMesa("M1", "123", "rechazado");
      expect(mockEnviar).toHaveBeenCalled();
    });

    it("debería manejar el caso cuando el docente no existe en la mesa", async () => {
      const mesa = await mesaService.confirmarMesa("M1", "999", "aceptado");
      expect(mesa).toBeDefined();
      expect(mockEnviar).not.toHaveBeenCalled();
    });
  });

  describe("enviarRecordatorio - casos adicionales", () => {
    it("debería manejar el caso cuando la mesa no existe", async () => {
      await expect(mesaService.enviarRecordatorio("MesaInexistente")).resolves.not.toThrow();
      expect(mockEnviar).not.toHaveBeenCalled();
    });
>>>>>>> origin/main
  });
});
