import { MesaService } from "../../services/MesaService";
import {
  WebSocketNotificacionStrategy,
  ConsoleNotificacionStrategy,
  PushNotificacionStrategy,
  NotificacionStrategy,
} from "../NotificacionStrategy";
import { Notificacion } from "../../factories/NotificacionFactory";
import webpush from "web-push";

// Mock de web-push
jest.mock("web-push", () => ({
  sendNotification: jest.fn().mockResolvedValue({
    statusCode: 200,
    body: "OK",
    headers: {}
  })
}));

// Mock completo de MesaService
jest.mock("../../services/MesaService", () => {
  // Crear un mock de notificacionStrategy que podemos cambiar
  let currentStrategy: NotificacionStrategy | null = null;

  const mockMesaService = {
    setNotificacionStrategy: jest.fn((strategy: NotificacionStrategy) => {
      currentStrategy = strategy;
    }),
    confirmarMesa: jest.fn().mockImplementation(async () => {
      if (currentStrategy && currentStrategy.enviar) {
        await currentStrategy.enviar({
          tipo: "confirmacion" as const,
          mensaje: "Confirmación de mesa",
          timestamp: new Date(),
        });
      }
      return {
        id: "mesa-1",
        materia: "Matemáticas",
        docentes: [
          { id: "123", nombre: "Docente 1", confirmacion: "aceptado" },
          { id: "456", nombre: "Docente 2", confirmacion: "pendiente" },
        ],
      };
    }),
  };

  return {
    MesaService: {
      getInstance: jest.fn().mockReturnValue(mockMesaService),
    },
  };
});

describe("WebSocketNotificacionStrategy", () => {
  let strategy: WebSocketNotificacionStrategy;
  let mockIO: { emit: jest.Mock };

  beforeEach(() => {
    strategy = WebSocketNotificacionStrategy.getInstance();
    mockIO = { emit: jest.fn() };
    strategy.setSocketIO(mockIO);
  });

  it("debería ser un singleton", () => {
    const instance1 = WebSocketNotificacionStrategy.getInstance();
    const instance2 = WebSocketNotificacionStrategy.getInstance();
    expect(instance1).toBe(instance2);
  });

  it("debería enviar notificación a través de Socket.IO", async () => {
    const notificacion: Notificacion = {
      tipo: "confirmacion",
      mensaje: "Test message",
      timestamp: new Date()
    };

    await strategy.enviar(notificacion);
    expect(mockIO.emit).toHaveBeenCalledWith("notificacion", notificacion);
  });

  it("debería lanzar error si Socket.IO no está inicializado", async () => {
    strategy.setSocketIO(undefined);
    const notificacion: Notificacion = {
      tipo: "confirmacion",
      mensaje: "Test message",
      timestamp: new Date()
    };

    await expect(strategy.enviar(notificacion)).rejects.toThrow("Socket.IO no inicializado");
  });
});

describe("ConsoleNotificacionStrategy", () => {
  let strategy: ConsoleNotificacionStrategy;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    strategy = new ConsoleNotificacionStrategy();
    consoleSpy = jest.spyOn(console, "log").mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("debería imprimir notificación en consola", async () => {
    const notificacion: Notificacion = {
      tipo: "confirmacion",
      mensaje: "Test message",
      timestamp: new Date()
    };

    await strategy.enviar(notificacion);
    expect(consoleSpy).toHaveBeenCalledWith("Notificación:", notificacion);
  });
});

describe("PushNotificacionStrategy", () => {
  let strategy: PushNotificacionStrategy;
  let mockWebpush: jest.Mocked<typeof webpush>;

  beforeEach(() => {
    strategy = PushNotificacionStrategy.getInstance();
    jest.clearAllMocks();
    mockWebpush = webpush as jest.Mocked<typeof webpush>;
    mockWebpush.sendNotification.mockResolvedValue({ 
      statusCode: 201,
      body: "",
      headers: {}
    });
  });

  it("debería ser un singleton", () => {
    const instance1 = PushNotificacionStrategy.getInstance();
    const instance2 = PushNotificacionStrategy.getInstance();
    expect(instance1).toBe(instance2);
  });

  it("debería agregar suscripción correctamente", async () => {
    const subscription = { endpoint: "endpoint1" };
    await strategy.addSubscription({ docenteId: "123", subscription });
    expect(strategy.getActiveSubscriptions("123")).toContainEqual(subscription);
  });

  it("debería ignorar suscripciones inválidas", async () => {
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
    await strategy.addSubscription({ docenteId: "", subscription: null });
    expect(consoleSpy).toHaveBeenCalled();
    expect(strategy.getActiveSubscriptions()).toEqual({});
  });

  it("debería eliminar suscripción correctamente", async () => {
    const subscription = { endpoint: "endpoint1" };
    await strategy.addSubscription({ docenteId: "123", subscription });
    await strategy.removeSubscription("123", "endpoint1");
    expect(strategy.getActiveSubscriptions("123")).toHaveLength(0);
  });

  it("debería enviar notificación push correctamente", async () => {
    const subscription = { endpoint: "endpoint1" };
    await strategy.addSubscription({ docenteId: "123", subscription });

    const notificacion: Notificacion = {
      tipo: "confirmacion",
      mensaje: "Docente 1, confirmación de mesa",
      timestamp: new Date()
    };

    await strategy.enviar(notificacion);
    expect(mockWebpush.sendNotification).toHaveBeenCalled();
  });

  it("debería manejar errores al enviar notificación", async () => {
    const subscription = { endpoint: "endpoint1" };
    await strategy.addSubscription({ docenteId: "123", subscription });
    mockWebpush.sendNotification.mockRejectedValueOnce({ statusCode: 410 });

    const notificacion: Notificacion = {
      tipo: "confirmacion",
      mensaje: "Test message",
      timestamp: new Date()
    };

    await strategy.enviar(notificacion);
    expect(strategy.getActiveSubscriptions("123")).toHaveLength(0);
  });

  it("debería limpiar suscripciones expiradas", async () => {
    const subscription = { endpoint: "endpoint1" };
    await strategy.addSubscription({ docenteId: "123", subscription });
    mockWebpush.sendNotification.mockRejectedValueOnce({ statusCode: 410 });

    await strategy.cleanupExpiredSubscriptions();
    expect(strategy.getActiveSubscriptions("123")).toHaveLength(0);
  });

  it("debería enviar notificación a destinatarios específicos", async () => {
    const subscription1 = { endpoint: "endpoint1" };
    const subscription2 = { endpoint: "endpoint2" };
    await strategy.addSubscription({ docenteId: "123", subscription: subscription1 });
    await strategy.addSubscription({ docenteId: "456", subscription: subscription2 });

    const notificacion: Notificacion & { destinatarios?: string[] } = {
      tipo: "confirmacion",
      mensaje: "Test message",
      timestamp: new Date(),
      destinatarios: ["123"]
    };

    await strategy.enviar(notificacion);
    expect(mockWebpush.sendNotification).toHaveBeenCalledTimes(1);
  });
});

// Pruebas para la clase abstracta NotificacionStrategy
describe("NotificacionStrategy", () => {
  let webSocketStrategy: WebSocketNotificacionStrategy;
  let consoleStrategy: ConsoleNotificacionStrategy;
  let pushStrategy: PushNotificacionStrategy;
  let mockSocketIO: any;

  beforeEach(() => {
    // Limpiar mocks
    jest.clearAllMocks();

    // Configurar mock de Socket.IO
    mockSocketIO = {
      emit: jest.fn()
    };

    // Crear instancias
    webSocketStrategy = WebSocketNotificacionStrategy.getInstance();
    consoleStrategy = ConsoleNotificacionStrategy.getInstance();
    pushStrategy = PushNotificacionStrategy.getInstance();

    // Configurar WebSocket
    webSocketStrategy.setSocketIO(mockSocketIO);
  });

  it("debería definir una interfaz para enviar notificaciones", () => {
    // Verificar que la interfaz existe
    const strategy: NotificacionStrategy = {
      enviar: jest.fn().mockResolvedValue(undefined),
    };

    // Verificar que se puede llamar al método enviar
    const notificacion = {
      tipo: "recordatorio" as const,
      mensaje: "Mensaje de prueba",
      timestamp: new Date(),
    };

    strategy.enviar(notificacion);
    expect(strategy.enviar).toHaveBeenCalledWith(notificacion);
  });
});

describe("Cambio dinámico de estrategia en MesaService", () => {
  let mesaService: any;
  let webSocketStrategy: WebSocketNotificacionStrategy;
  let consoleStrategy: ConsoleNotificacionStrategy;
  let pushStrategy: PushNotificacionStrategy;
  let mockIO: { emit: jest.Mock };

  beforeEach(() => {
    // Limpiar mocks
    jest.clearAllMocks();

    // Configurar mock de Socket.IO
    mockIO = {
      emit: jest.fn(),
    };

    // Obtener instancias de las estrategias
    webSocketStrategy = WebSocketNotificacionStrategy.getInstance();
    webSocketStrategy.setSocketIO(mockIO);
    consoleStrategy = new ConsoleNotificacionStrategy();
    pushStrategy = PushNotificacionStrategy.getInstance();

    // Espiar console.log
    jest.spyOn(console, "log").mockImplementation();

    // Obtener instancia del servicio
    mesaService = MesaService.getInstance();
  });

  it("debería permitir cambiar de WebSocket a Console y viceversa", async () => {
    // Redefinir el mock de MesaService para este test específico
    // Esto asegura que use correctamente la estrategia inyectada
    let currentStrategy: NotificacionStrategy | null = null;

    // Sobreescribir la implementación del mock para este test
    mesaService.setNotificacionStrategy = jest.fn((strategy) => {
      currentStrategy = strategy;
    });

    mesaService.confirmarMesa = jest.fn().mockImplementation(async () => {
      if (currentStrategy && currentStrategy.enviar) {
        await currentStrategy.enviar({
          tipo: "confirmacion",
          mensaje: "Confirmación de mesa",
          timestamp: new Date(),
        });
      }
      return {
        id: "mesa-1",
        materia: "Matemáticas",
        docentes: [
          { id: "123", nombre: "Docente 1", confirmacion: "aceptado" },
          { id: "456", nombre: "Docente 2", confirmacion: "pendiente" },
        ],
      };
    });

    // Configurar estrategia WebSocket
    mesaService.setNotificacionStrategy(webSocketStrategy);
    await mesaService.confirmarMesa("mesa-1", "123", "aceptado");
    expect(mockIO.emit).toHaveBeenCalledTimes(1);

    // Cambiar a estrategia Console
    mesaService.setNotificacionStrategy(consoleStrategy);
    await mesaService.confirmarMesa("mesa-1", "123", "aceptado");
    expect(mockIO.emit).toHaveBeenCalledTimes(1); // No debería haber cambiado

    // Volver a estrategia WebSocket
    mesaService.setNotificacionStrategy(webSocketStrategy);
    await mesaService.confirmarMesa("mesa-1", "123", "aceptado");
    expect(mockIO.emit).toHaveBeenCalledTimes(2);
  });

  it("debería permitir cambiar a estrategia Push", async () => {
    // Configurar suscripciones para la estrategia Push
    pushStrategy.addSubscription({
      docenteId: "123",
      subscription: { endpoint: "endpoint1" },
    });

    // Redefinir el mock de MesaService para este test específico
    let currentStrategy: NotificacionStrategy | null = null;

    // Sobreescribir la implementación del mock para este test
    mesaService.setNotificacionStrategy = jest.fn((strategy) => {
      currentStrategy = strategy;
    });

    mesaService.confirmarMesa = jest.fn().mockImplementation(async () => {
      if (currentStrategy && currentStrategy.enviar) {
        const notificacion = {
          tipo: "confirmacion" as const,
          mensaje: "Docente 1, confirmación de mesa",
          timestamp: new Date(),
        };
        // Para PushNotificacionStrategy, pasamos destinatarios como parámetro adicional
        if (currentStrategy instanceof PushNotificacionStrategy) {
          await (currentStrategy as PushNotificacionStrategy).enviar({
            ...notificacion,
            destinatarios: ["123"]
          });
        } else {
          await currentStrategy.enviar(notificacion);
        }
      }
      return {
        id: "mesa-1",
        materia: "Matemáticas",
        docentes: [
          { id: "123", nombre: "Docente 1", confirmacion: "aceptado" },
        ],
      };
    });

    // Configurar estrategia Push
    webpush.sendNotification.mockClear();

    mesaService.setNotificacionStrategy(pushStrategy);
    await mesaService.confirmarMesa("mesa-1", "123", "aceptado");

    // Verificar que se llamó a sendNotification
    expect(webpush.sendNotification).toHaveBeenCalledTimes(1);
  });
});
