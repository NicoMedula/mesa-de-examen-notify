import { MesaService } from "../MesaService";
import {
  ConsoleNotificacionStrategy,
  PushNotificacionStrategy,
} from "../../strategies/NotificacionStrategy";
import { MesaRepository } from "../../repositories/MesaRepository";
import { Mesa, Docente, EstadoMesa, EstadoConfirmacion } from "../../types";
import { WebSocketNotificacionStrategy } from "../../strategies/NotificacionStrategy";
import { NotificacionFactory } from "../../factories/NotificacionFactory";

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

// Mock de MesaRepository
jest.mock("../../repositories/MesaRepository");
const mockMesaRepositoryClass = MesaRepository as jest.MockedClass<typeof MesaRepository>;

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
  let mockMesaRepository: jest.Mocked<MesaRepository>;
  let mockWebSocketStrategy: jest.Mocked<WebSocketNotificacionStrategy>;
  let mockConsoleStrategy: jest.Mocked<ConsoleNotificacionStrategy>;
  let mockPushStrategy: jest.Mocked<PushNotificacionStrategy>;

  const mockMesa: Mesa = {
    id: "1",
    materia: "Matemática I",
    fecha: "2024-03-20",
    hora: "14:00",
    aula: "Aula 101",
    estado: "pendiente" as EstadoMesa,
    docente_titular: "123",
    docente_vocal: "456",
    docentes: [
      {
        id: "123",
        nombre: "Docente 1",
        confirmacion: "pendiente" as EstadoConfirmacion
      },
      {
        id: "456",
        nombre: "Docente 2",
        confirmacion: "pendiente" as EstadoConfirmacion
      }
    ]
  };

  beforeEach(() => {
    // Limpiar mocks
    jest.clearAllMocks();

    // Configurar mocks
    mockMesaRepository = {
      getMesasByDocenteId: jest.fn().mockResolvedValue([mockMesa]),
      updateConfirmacion: jest.fn().mockResolvedValue(mockMesa),
      getAllMesas: jest.fn().mockResolvedValue([mockMesa]),
      createMesa: jest.fn().mockResolvedValue(mockMesa),
      updateMesa: jest.fn().mockResolvedValue(mockMesa),
      deleteMesa: jest.fn().mockResolvedValue(undefined),
      getMesaById: jest.fn().mockResolvedValue(mockMesa),
      confirmarMesa: jest.fn().mockResolvedValue(mockMesa)
    } as unknown as jest.Mocked<MesaRepository>;

    mockWebSocketStrategy = {
      enviar: jest.fn(),
      setSocketIO: jest.fn()
    } as unknown as jest.Mocked<WebSocketNotificacionStrategy>;

    mockConsoleStrategy = {
      enviar: jest.fn()
    } as unknown as jest.Mocked<ConsoleNotificacionStrategy>;

    mockPushStrategy = {
      enviar: jest.fn(),
      addSubscription: jest.fn(),
      removeSubscription: jest.fn(),
      getActiveSubscriptions: jest.fn(),
      cleanupExpiredSubscriptions: jest.fn()
    } as unknown as jest.Mocked<PushNotificacionStrategy>;

    // Configurar instancias mock
    jest.spyOn(MesaRepository, "getInstance").mockReturnValue(mockMesaRepository);
    WebSocketNotificacionStrategy.getInstance = jest.fn().mockReturnValue(mockWebSocketStrategy);
    PushNotificacionStrategy.getInstance = jest.fn().mockReturnValue(mockPushStrategy);

    // Configurar mock de NotificacionFactory
    NotificacionFactory.crearNotificacionConfirmacion = jest.fn().mockReturnValue({
      tipo: "confirmacion",
      mensaje: "Test message",
      timestamp: new Date()
    });
    NotificacionFactory.crearNotificacionRecordatorio = jest.fn().mockReturnValue({
      tipo: "recordatorio",
      mensaje: "Test message",
      timestamp: new Date()
    });
    NotificacionFactory.crearNotificacionActualizacion = jest.fn().mockReturnValue({
      tipo: "actualizacion",
      mensaje: "Test message",
      timestamp: new Date()
    });

    // Crear instancia del servicio
    mesaService = MesaService.getInstance(mockWebSocketStrategy);
  });

  it("debería ser un singleton", () => {
    const instance1 = MesaService.getInstance();
    const instance2 = MesaService.getInstance();
    expect(instance1).toBe(instance2);
  });

  it("debería obtener mesas por ID de docente", async () => {
    const result = await mesaService.getMesasByDocenteId("123");
    expect(result).toEqual([mockMesa]);
    expect(mockMesaRepository.getMesasByDocenteId).toHaveBeenCalledWith("123");
  });

  it("debería confirmar una mesa", async () => {
    const mesaActualizada: Mesa = {
      ...mockMesa,
      docentes: [
        { ...mockMesa.docentes[0], confirmacion: "aceptado" as EstadoConfirmacion },
        mockMesa.docentes[1]
      ]
    };
    mockMesaRepository.updateConfirmacion.mockResolvedValue(mesaActualizada);

    const result = await mesaService.confirmarMesa("1", "123", "aceptado");
    expect(result).toEqual(mesaActualizada);
    expect(mockMesaRepository.updateConfirmacion).toHaveBeenCalledWith("1", "123", "aceptado");
    expect(mockWebSocketStrategy.enviar).toHaveBeenCalled();
  });

  it("debería enviar recordatorio", async () => {
    const mesaConfirmada: Mesa = {
      ...mockMesa,
      estado: "confirmada" as EstadoMesa
    };
    mockMesaRepository.getAllMesas.mockResolvedValue([mesaConfirmada]);

    await mesaService.enviarRecordatorio("1");
    expect(mockWebSocketStrategy.enviar).toHaveBeenCalled();
  });

  it("debería crear una mesa", async () => {
    const result = await mesaService.createMesa(mockMesa);
    expect(result).toEqual(mockMesa);
    expect(mockMesaRepository.createMesa).toHaveBeenCalledWith(mockMesa);
    expect(mockPushStrategy.enviar).toHaveBeenCalled();
  });

  it("debería actualizar una mesa", async () => {
    const mesaActualizada: Mesa = {
      ...mockMesa,
      aula: "Aula 102"
    };
    mockMesaRepository.updateMesa.mockResolvedValue(mesaActualizada);

    const result = await mesaService.updateMesa("1", { aula: "Aula 102" });
    expect(result).toEqual(mesaActualizada);
    expect(mockMesaRepository.updateMesa).toHaveBeenCalledWith("1", { aula: "Aula 102" });
  });

  it("debería eliminar una mesa", async () => {
    await mesaService.deleteMesa("1");
    expect(mockMesaRepository.deleteMesa).toHaveBeenCalledWith("1");
  });

  it("debería obtener todas las mesas", async () => {
    const result = await mesaService.getAllMesas();
    expect(result).toEqual([mockMesa]);
    expect(mockMesaRepository.getAllMesas).toHaveBeenCalled();
  });

  it("debería cambiar la estrategia de notificación", async () => {
    mesaService.setNotificacionStrategy(mockConsoleStrategy);
    await mesaService.confirmarMesa("1", "123", "aceptado");
    expect(mockConsoleStrategy.enviar).toHaveBeenCalled();
  });

  it("debería manejar errores al confirmar mesa", async () => {
    const error = new Error("Error de base de datos");
    mockMesaRepository.updateConfirmacion.mockRejectedValue(error);
    await expect(mesaService.confirmarMesa("1", "123", "aceptado")).rejects.toThrow(error);
  });

  it("debería notificar cuando ambos docentes aceptan", async () => {
    const mesaConAmbosAceptados: Mesa = {
      ...mockMesa,
      docentes: [
        { ...mockMesa.docentes[0], confirmacion: "aceptado" as EstadoConfirmacion },
        { ...mockMesa.docentes[1], confirmacion: "aceptado" as EstadoConfirmacion }
      ]
    };
    mockMesaRepository.updateConfirmacion.mockResolvedValue(mesaConAmbosAceptados);

    await mesaService.confirmarMesa("1", "123", "aceptado");
    expect(mockPushStrategy.enviar).toHaveBeenCalledTimes(2); // Una para docentes y otra para departamento
  });

  it("debería notificar cuando un docente rechaza", async () => {
    const mesaConRechazo: Mesa = {
      ...mockMesa,
      docentes: [
        { ...mockMesa.docentes[0], confirmacion: "rechazado" as EstadoConfirmacion },
        mockMesa.docentes[1]
      ]
    };
    mockMesaRepository.updateConfirmacion.mockResolvedValue(mesaConRechazo);

    await mesaService.confirmarMesa("1", "123", "rechazado");
    expect(mockPushStrategy.enviar).toHaveBeenCalledTimes(2); // Una para el otro docente y otra para departamento
  });
});
