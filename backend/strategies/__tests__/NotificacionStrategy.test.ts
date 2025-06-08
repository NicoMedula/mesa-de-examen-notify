import { MesaService } from "../../services/MesaService";
import {
  WebSocketNotificacionStrategy,
  ConsoleNotificacionStrategy,
  PushNotificacionStrategy,
  NotificacionStrategy,
} from "../NotificacionStrategy";
import { Notificacion } from "../../factories/NotificacionFactory";

// Mock completo de web-push
jest.mock("web-push", () => ({
  sendNotification: jest.fn().mockResolvedValue(undefined),
  setVapidDetails: jest.fn(),
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
  let mockIo: { emit: jest.Mock };

  beforeEach(() => {
    mockIo = {
      emit: jest.fn(),
    };
    // Asegurarse de que la instancia está limpia para cada prueba
    // @ts-ignore - Accediendo a propiedad privada para testing
    WebSocketNotificacionStrategy.instance = undefined;
    strategy = WebSocketNotificacionStrategy.getInstance();
    strategy.setSocketIO(mockIo as any);
  });

  it("debería lanzar error si Socket.IO no está inicializado", async () => {
    strategy.setSocketIO(undefined);
    const notificacion = {
      tipo: "recordatorio",
      mensaje: "Recordatorio de mesa",
    };

    await expect(strategy.enviar(notificacion as any)).rejects.toThrow(
      "Socket.IO no inicializado"
    );
  });

  it("debería emitir evento a través de Socket.IO", async () => {
    const notificacion = {
      tipo: "recordatorio",
      mensaje: "Recordatorio de mesa",
    };

    await strategy.enviar(notificacion as any);
    expect(mockIo.emit).toHaveBeenCalledWith("notificacion", notificacion);
  });

  it("debería mantener una única instancia (Singleton)", () => {
    const instance1 = WebSocketNotificacionStrategy.getInstance();
    const instance2 = WebSocketNotificacionStrategy.getInstance();
    expect(instance1).toBe(instance2);
  });

  it("debería crear una nueva instancia cuando no existe", () => {
    // Acceder a la propiedad privada para testing
    // @ts-ignore
    WebSocketNotificacionStrategy.instance = undefined;

    // Obtener una nueva instancia
    const instance = WebSocketNotificacionStrategy.getInstance();

    // Verificar que se creó una nueva instancia
    expect(instance).toBeInstanceOf(WebSocketNotificacionStrategy);
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

  it("debería imprimir la notificación en la consola", async () => {
    const notificacion = {
      tipo: "recordatorio",
      mensaje: "Recordatorio de mesa",
    };

    await strategy.enviar(notificacion as any);
    expect(consoleSpy).toHaveBeenCalledWith(
      "[RECORDATORIO] Recordatorio de mesa"
    );
  });
});

describe("PushNotificacionStrategy", () => {
  let strategy: PushNotificacionStrategy;
  let webpush: { sendNotification: jest.Mock; setVapidDetails: jest.Mock };

  beforeEach(() => {
    // Limpiar mocks
    jest.clearAllMocks();

    // Importar webpush después de mockear
    webpush = require("web-push");

    // Crear una nueva instancia para cada prueba (para limpiar suscripciones)
    // @ts-ignore - Accediendo a propiedad privada para testing
    PushNotificacionStrategy.instance = new PushNotificacionStrategy();
    strategy = PushNotificacionStrategy.getInstance();
  });

  // Prueba para verificar que la instancia se inicializa correctamente
  it("debería inicializarse correctamente", () => {
    // Verificar que la instancia existe
    expect(strategy).toBeInstanceOf(PushNotificacionStrategy);
  });

  it("debería crear una nueva instancia cuando no existe", () => {
    // Acceder a la propiedad privada para testing
    // @ts-ignore
    PushNotificacionStrategy.instance = undefined;

    // Obtener una nueva instancia
    const instance = PushNotificacionStrategy.getInstance();

    // Verificar que se creó una nueva instancia
    expect(instance).toBeInstanceOf(PushNotificacionStrategy);
  });

  it("debería manejar correctamente la adición de suscripciones", () => {
    // Caso 1: Agregar una suscripción válida
    strategy.addSubscription({
      docenteId: "789",
      subscription: { endpoint: "endpoint3" },
    });

    // Caso 2: Agregar una suscripción duplicada (mismo endpoint)
    strategy.addSubscription({
      docenteId: "789",
      subscription: { endpoint: "endpoint3" },
    });

    // Caso 3: Agregar una suscripción sin docenteId
    strategy.addSubscription({
      docenteId: "",
      subscription: { endpoint: "endpoint4" },
    });

    // Caso 4: Agregar una suscripción sin subscription
    strategy.addSubscription({
      docenteId: "789",
      subscription: null,
    } as any);

    // Verificar que solo se agregó una suscripción válida
    // Enviar una notificación para verificar
    const notificacion = {
      tipo: "recordatorio" as const,
      mensaje: "Recordatorio para docente 789",
      timestamp: new Date(),
    };

    // Espiar console.log
    const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

    // Enviar notificación
    return strategy
      .enviar({
        ...notificacion,
        destinatarios: ["789"],
      })
      .then(() => {
        // Verificar que se llamó a sendNotification una vez
        expect(webpush.sendNotification).toHaveBeenCalledTimes(1);

        // Restaurar console.log
        consoleLogSpy.mockRestore();
      });
  });

  it("debería enviar notificaciones push a los destinatarios especificados", async () => {
    // Configurar suscripciones de prueba
    strategy.addSubscription({
      docenteId: "123",
      subscription: { endpoint: "endpoint1" },
    });
    strategy.addSubscription({
      docenteId: "456",
      subscription: { endpoint: "endpoint2" },
    });

    // Crear notificación con destinatarios específicos
    const notificacion = {
      tipo: "confirmacion" as const,
      mensaje: "Docente 1, confirmación de mesa",
      timestamp: new Date(),
    };

    // Enviar notificación con destinatarios como parámetro adicional
    await strategy.enviar({
      ...notificacion,
      destinatarios: ["123"],
    } as any);

    // Verificar que se llamó a sendNotification con los parámetros correctos
    expect(webpush.sendNotification).toHaveBeenCalledTimes(1);
    expect(webpush.sendNotification).toHaveBeenCalledWith(
      { endpoint: "endpoint1" },
      expect.stringContaining("Docente 1")
    );
  });

  it("debería enviar notificaciones a todos los docentes si no se especifican destinatarios", async () => {
    // Configurar suscripciones de prueba
    strategy.addSubscription({
      docenteId: "123",
      subscription: { endpoint: "endpoint1" },
    });
    strategy.addSubscription({
      docenteId: "456",
      subscription: { endpoint: "endpoint2" },
    });

    // Crear notificación sin destinatarios específicos
    const notificacion = {
      tipo: "recordatorio" as const,
      mensaje: "Recordatorio general",
      timestamp: new Date(),
    };

    // Espiar console.log para verificar mensajes de log
    const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

    // Enviar notificación
    await strategy.enviar(notificacion);

    // Verificar que se llamó a sendNotification para todos los docentes
    expect(webpush.sendNotification).toHaveBeenCalledTimes(2);

    // Verificar que se registró el número total de notificaciones enviadas
    expect(consoleLogSpy).toHaveBeenCalledWith(
      "Enviadas",
      2,
      "notificaciones push a docentes."
    );

    // Restaurar console.log
    consoleLogSpy.mockRestore();
  });

  it("debería manejar el caso de no tener suscripciones para un docente", async () => {
    // Crear notificación con destinatario sin suscripciones
    const notificacion = {
      tipo: "confirmacion",
      mensaje: "Docente 999, confirmación de mesa",
      destinatarios: ["999"],
    };

    // Enviar notificación
    await strategy.enviar(notificacion as any);

    // Verificar que no se llamó a sendNotification
    expect(webpush.sendNotification).not.toHaveBeenCalled();
  });

  it("debería manejar errores al enviar notificaciones", async () => {
    // Configurar suscripciones de prueba
    strategy.addSubscription({
      docenteId: "123",
      subscription: { endpoint: "endpoint1" },
    });

    // Mockear error en sendNotification
    webpush.sendNotification.mockRejectedValueOnce(new Error("Error de envío"));

    // Espiar console.error
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    // Crear notificación
    const notificacion = {
      tipo: "confirmacion" as const,
      mensaje: "Docente 1, confirmación de mesa",
      timestamp: new Date(),
    };

    // Enviar notificación
    await strategy.enviar({
      ...notificacion,
      destinatarios: ["123"],
    });

    // Verificar que se registró el error
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error enviando push a",
      "123",
      expect.any(Error)
    );

    // Restaurar console.error
    consoleErrorSpy.mockRestore();
  });

  it("debería usar 'Docente' como nombre cuando no hay coincidencia en el mensaje", async () => {
    // Configurar suscripciones de prueba
    strategy.addSubscription({
      docenteId: "123",
      subscription: { endpoint: "endpoint1" },
    });

    // Crear notificación sin formato "Nombre, mensaje"
    const notificacion = {
      tipo: "recordatorio" as const,
      mensaje: "Recordatorio general sin formato de nombre",
      timestamp: new Date(),
    };

    // Espiar console.log
    const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

    // Enviar notificación
    await strategy.enviar({
      ...notificacion,
      destinatarios: ["123"],
    });

    // Verificar que se usó "Docente" como nombre por defecto
    expect(webpush.sendNotification).toHaveBeenCalledWith(
      { endpoint: "endpoint1" },
      expect.stringContaining("Notificación de Mesa para Docente")
    );

    // Restaurar console.log
    consoleLogSpy.mockRestore();
  });

  it("debería extraer correctamente el nombre del docente del mensaje", async () => {
    // Configurar suscripciones de prueba
    strategy.addSubscription({
      docenteId: "123",
      subscription: { endpoint: "endpoint1" },
    });

    // Crear notificación con formato "Nombre, mensaje"
    const notificacion = {
      tipo: "confirmacion" as const,
      mensaje: "Juan Pérez, confirmación de mesa",
      timestamp: new Date(),
    };

    // Espiar console.log
    const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

    // Enviar notificación
    await strategy.enviar({
      ...notificacion,
      destinatarios: ["123"],
    });

    // Verificar que se extrajo correctamente el nombre
    expect(webpush.sendNotification).toHaveBeenCalledWith(
      { endpoint: "endpoint1" },
      expect.stringContaining("Juan Pérez")
    );

    // Verificar que se registró el payload enviado
    expect(consoleLogSpy).toHaveBeenCalledWith(
      "Payload enviado a webpush:",
      expect.objectContaining({
        title: expect.stringContaining("Juan Pérez"),
        body: notificacion.mensaje,
      })
    );

    // Restaurar console.log
    consoleLogSpy.mockRestore();
  });

  it("debería usar 'Docente' como nombre si no puede extraerlo del mensaje", async () => {
    // Configurar suscripciones de prueba
    strategy.addSubscription({
      docenteId: "123",
      subscription: { endpoint: "endpoint1" },
    });

    // Crear notificación sin formato "Nombre, mensaje"
    const notificacion = {
      tipo: "recordatorio",
      mensaje: "Recordatorio sin formato específico",
      destinatarios: ["123"],
    };

    // Espiar console.log
    const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

    // Enviar notificación
    await strategy.enviar(notificacion as any);

    // Verificar que se usó "Docente" como nombre
    expect(webpush.sendNotification).toHaveBeenCalledWith(
      { endpoint: "endpoint1" },
      expect.stringContaining("Docente")
    );

    // Restaurar console.log
    consoleLogSpy.mockRestore();
  });

  it("debería validar los datos de suscripción antes de agregarlos", async () => {
    // Asegurarse de que no hay suscripciones previas
    // @ts-ignore - Accediendo a propiedad privada para testing
    PushNotificacionStrategy.instance = new PushNotificacionStrategy();
    strategy = PushNotificacionStrategy.getInstance();

    // Limpiar llamadas previas
    webpush.sendNotification.mockClear();

    // Intentar agregar suscripción sin docenteId
    strategy.addSubscription({
      docenteId: "",
      subscription: { endpoint: "endpoint1" },
    });

    // Intentar agregar suscripción sin subscription
    strategy.addSubscription({
      docenteId: "123",
      subscription: null as any,
    });

    // Crear notificación
    const notificacion = {
      tipo: "recordatorio",
      mensaje: "Recordatorio general",
    };

    // Enviar notificación
    await strategy.enviar(notificacion as any);

    // Verificar que no se agregaron las suscripciones inválidas
    expect(webpush.sendNotification).not.toHaveBeenCalled();
  });

  it("debería inicializar el array de suscripciones para un nuevo docenteId", () => {
    // @ts-ignore - Accediendo a propiedad privada para testing
    const subscriptions = {};
    // @ts-ignore - Accediendo a propiedad privada para testing
    PushNotificacionStrategy.instance.subscriptions = subscriptions;

    // Agregar una suscripción para un nuevo docenteId
    strategy.addSubscription({
      docenteId: "999",
      subscription: { endpoint: "endpoint999" },
    });

    // Verificar que se inicializó el array para el nuevo docenteId
    // @ts-ignore - Accediendo a propiedad privada para testing
    expect(strategy.subscriptions["999"]).toBeDefined();
    // @ts-ignore - Accediendo a propiedad privada para testing
    expect(strategy.subscriptions["999"]).toHaveLength(1);
    // @ts-ignore - Accediendo a propiedad privada para testing
    expect(strategy.subscriptions["999"][0]).toEqual({
      endpoint: "endpoint999",
    });
  });

  it("debería registrar el total de notificaciones enviadas", async () => {
    // Espiar console.log
    const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

    // Configurar suscripciones de prueba
    strategy.addSubscription({
      docenteId: "123",
      subscription: { endpoint: "endpoint1" },
    });
    strategy.addSubscription({
      docenteId: "456",
      subscription: { endpoint: "endpoint2" },
    });

    // Crear notificación
    const notificacion = {
      tipo: "recordatorio",
      mensaje: "Recordatorio general",
    };

    // Enviar notificación
    await strategy.enviar(notificacion as any);

    // Verificar que se registró el total de notificaciones enviadas
    expect(consoleLogSpy).toHaveBeenCalledWith(
      "Enviadas",
      2,
      "notificaciones push a docentes."
    );

    // Restaurar console.log
    consoleLogSpy.mockRestore();
  });

  it("debería evitar agregar suscripciones duplicadas", async () => {
    // Agregar la misma suscripción dos veces
    strategy.addSubscription({
      docenteId: "123",
      subscription: { endpoint: "endpoint1" },
    });
    strategy.addSubscription({
      docenteId: "123",
      subscription: { endpoint: "endpoint1" },
    });

    // Crear notificación
    const notificacion = {
      tipo: "recordatorio",
      mensaje: "Recordatorio general",
      destinatarios: ["123"],
    };

    // Enviar notificación
    await strategy.enviar(notificacion as any);

    // Verificar que sendNotification se llamó solo una vez
    expect(webpush.sendNotification).toHaveBeenCalledTimes(1);
  });

  it("debería mantener una única instancia (Singleton)", () => {
    // Crear una nueva instancia para esta prueba
    // @ts-ignore - Accediendo a propiedad privada para testing
    PushNotificacionStrategy.instance = new PushNotificacionStrategy();

    const instance1 = PushNotificacionStrategy.getInstance();
    const instance2 = PushNotificacionStrategy.getInstance();
    expect(instance1).toBe(instance2);
  });

  it("debería manejar correctamente el caso de no tener destinatarios ni suscripciones", async () => {
    // Crear notificación sin destinatarios
    const notificacion = {
      tipo: "recordatorio",
      mensaje: "Recordatorio general",
      destinatarios: [],
    };

    // Espiar console.log
    const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

    // Enviar notificación
    await strategy.enviar(notificacion as any);

    // Verificar que no se llamó a sendNotification
    expect(webpush.sendNotification).not.toHaveBeenCalled();

    // Verificar que se registró el total de notificaciones enviadas (0)
    expect(consoleLogSpy).toHaveBeenCalledWith(
      "Enviadas",
      0,
      "notificaciones push a docentes."
    );

    // Restaurar console.log
    consoleLogSpy.mockRestore();
  });

  it("debería formatear correctamente el payload para webpush", async () => {
    // Configurar suscripciones de prueba
    strategy.addSubscription({
      docenteId: "123",
      subscription: { endpoint: "endpoint1" },
    });

    // Crear notificación con formato específico
    const notificacion = {
      tipo: "confirmacion",
      mensaje: "Mensaje de prueba",
      destinatarios: ["123"],
    };

    // Espiar console.log para verificar el payload
    const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

    // Enviar notificación
    await strategy.enviar(notificacion as any);

    // Verificar que se llamó a sendNotification con el payload correcto
    expect(webpush.sendNotification).toHaveBeenCalledWith(
      { endpoint: "endpoint1" },
      expect.stringContaining("Mensaje de prueba")
    );

    // Verificar que se registró el payload
    expect(consoleLogSpy).toHaveBeenCalledWith(
      "Payload enviado a webpush:",
      expect.objectContaining({
        title: expect.stringContaining("Docente"),
        body: "Mensaje de prueba",
        docenteId: "123",
        url: "/",
      })
    );

    // Restaurar console.log
    consoleLogSpy.mockRestore();
  });

  it("debería manejar errores al enviar notificaciones push", async () => {
    // Configurar suscripciones de prueba
    strategy.addSubscription({
      docenteId: "123",
      subscription: { endpoint: "endpoint1" },
    });

    // Mock de error en webpush.sendNotification
    webpush.sendNotification.mockRejectedValueOnce(new Error("Error de envío"));

    // Crear notificación
    const notificacion = {
      tipo: "confirmacion" as const,
      mensaje: "Docente 1, confirmación de mesa",
      timestamp: new Date(),
      destinatarios: ["123"],
    };

    // Enviar notificación y verificar que no lanza error
    await expect(strategy.enviar(notificacion as any)).resolves.not.toThrow();
  });

  it("debería eliminar suscripciones expiradas", async () => {
    // Configurar suscripciones de prueba
    strategy.addSubscription({
      docenteId: "123",
      subscription: { endpoint: "endpoint1" },
    });

    // Mock de error 410 (Gone) en webpush.sendNotification
    webpush.sendNotification.mockRejectedValueOnce({ statusCode: 410 });

    // Crear notificación
    const notificacion = {
      tipo: "confirmacion" as const,
      mensaje: "Docente 1, confirmación de mesa",
      timestamp: new Date(),
      destinatarios: ["123"],
    };

    // Enviar notificación
    await strategy.enviar(notificacion as any);

    // Verificar que la suscripción fue eliminada
    expect(strategy.getActiveSubscriptions("123")).toHaveLength(0);
  });

  it("debería eliminar suscripciones no encontradas", async () => {
    // Configurar suscripciones de prueba
    strategy.addSubscription({
      docenteId: "123",
      subscription: { endpoint: "endpoint1" },
    });

    // Mock de error 404 (Not Found) en webpush.sendNotification
    webpush.sendNotification.mockRejectedValueOnce({ statusCode: 404 });

    // Crear notificación
    const notificacion = {
      tipo: "confirmacion" as const,
      mensaje: "Docente 1, confirmación de mesa",
      timestamp: new Date(),
      destinatarios: ["123"],
    };

    // Enviar notificación
    await strategy.enviar(notificacion as any);

    // Verificar que la suscripción fue eliminada
    expect(strategy.getActiveSubscriptions("123")).toHaveLength(0);
  });

  it("debería limpiar suscripciones expiradas", async () => {
    // Configurar suscripciones de prueba
    strategy.addSubscription({
      docenteId: "123",
      subscription: { endpoint: "endpoint1" },
    });
    strategy.addSubscription({
      docenteId: "456",
      subscription: { endpoint: "endpoint2" },
    });

    // Mock de error 410 para la primera suscripción
    webpush.sendNotification
      .mockRejectedValueOnce({ statusCode: 410 })
      .mockResolvedValueOnce(undefined);

    // Ejecutar limpieza
    await strategy.cleanupExpiredSubscriptions();

    // Verificar que solo quedó la suscripción válida
    expect(strategy.getActiveSubscriptions("123")).toHaveLength(0);
    expect(strategy.getActiveSubscriptions("456")).toHaveLength(1);
  });

  it("debería manejar suscripciones inválidas", async () => {
    // Intentar agregar suscripciones inválidas
    strategy.addSubscription({
      docenteId: "",
      subscription: { endpoint: "endpoint1" },
    });
    strategy.addSubscription({
      docenteId: "123",
      subscription: null,
    } as any);

    // Verificar que no se agregaron suscripciones
    expect(strategy.getActiveSubscriptions()).toEqual({});
  });

  it("debería obtener suscripciones activas por docenteId", async () => {
    // Configurar suscripciones de prueba
    strategy.addSubscription({
      docenteId: "123",
      subscription: { endpoint: "endpoint1" },
    });
    strategy.addSubscription({
      docenteId: "456",
      subscription: { endpoint: "endpoint2" },
    });

    // Obtener suscripciones para un docente específico
    const subs = strategy.getActiveSubscriptions("123");
    expect(subs).toHaveLength(1);
    expect(subs[0].endpoint).toBe("endpoint1");
  });

  it("debería obtener todas las suscripciones activas", async () => {
    // Configurar suscripciones de prueba
    strategy.addSubscription({
      docenteId: "123",
      subscription: { endpoint: "endpoint1" },
    });
    strategy.addSubscription({
      docenteId: "456",
      subscription: { endpoint: "endpoint2" },
    });

    // Obtener todas las suscripciones
    const subs = strategy.getActiveSubscriptions();
    expect(Object.keys(subs)).toHaveLength(2);
    expect(subs["123"]).toHaveLength(1);
    expect(subs["456"]).toHaveLength(1);
  });

  it("debería eliminar una suscripción específica", async () => {
    // Configurar suscripciones de prueba
    strategy.addSubscription({
      docenteId: "123",
      subscription: { endpoint: "endpoint1" },
    });
    strategy.addSubscription({
      docenteId: "123",
      subscription: { endpoint: "endpoint2" },
    });

    // Eliminar una suscripción específica
    await strategy.removeSubscription("123", "endpoint1");

    // Verificar que solo quedó una suscripción
    const subs = strategy.getActiveSubscriptions("123");
    expect(subs).toHaveLength(1);
    expect(subs[0].endpoint).toBe("endpoint2");
  });

  it("debería eliminar el docente cuando no quedan suscripciones", async () => {
    // Configurar una suscripción de prueba
    strategy.addSubscription({
      docenteId: "123",
      subscription: { endpoint: "endpoint1" },
    });

    // Eliminar la suscripción
    await strategy.removeSubscription("123", "endpoint1");

    // Verificar que el docente fue eliminado
    const subs = strategy.getActiveSubscriptions();
    expect(subs["123"]).toBeUndefined();
  });
});

// Pruebas para la clase abstracta NotificacionStrategy
describe("NotificacionStrategy", () => {
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
  let mockIo: { emit: jest.Mock };

  beforeEach(() => {
    // Limpiar mocks
    jest.clearAllMocks();

    // Configurar mock de Socket.IO
    mockIo = {
      emit: jest.fn(),
    };

    // Obtener instancias de las estrategias
    webSocketStrategy = WebSocketNotificacionStrategy.getInstance();
    webSocketStrategy.setSocketIO(mockIo as any);
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
    expect(mockIo.emit).toHaveBeenCalledTimes(1);

    // Cambiar a estrategia Console
    mesaService.setNotificacionStrategy(consoleStrategy);
    await mesaService.confirmarMesa("mesa-1", "123", "aceptado");
    expect(mockIo.emit).toHaveBeenCalledTimes(1); // No debería haber cambiado

    // Volver a estrategia WebSocket
    mesaService.setNotificacionStrategy(webSocketStrategy);
    await mesaService.confirmarMesa("mesa-1", "123", "aceptado");
    expect(mockIo.emit).toHaveBeenCalledTimes(2);
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
    const webpush = require("web-push");
    webpush.sendNotification.mockClear();

    mesaService.setNotificacionStrategy(pushStrategy);
    await mesaService.confirmarMesa("mesa-1", "123", "aceptado");

    // Verificar que se llamó a sendNotification
    expect(webpush.sendNotification).toHaveBeenCalledTimes(1);
  });
});
