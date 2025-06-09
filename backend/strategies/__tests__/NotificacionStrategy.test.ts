import {
  WebSocketNotificacionStrategy,
  ConsoleNotificacionStrategy,
  PushNotificacionStrategy,
} from "../NotificacionStrategy";
import { Notificacion } from "../../factories/NotificacionFactory";
import webpush from "web-push";

jest.mock("web-push");

describe("WebSocketNotificacionStrategy", () => {
  it("debería lanzar error si no se inicializó Socket.IO", async () => {
    const strategy = WebSocketNotificacionStrategy.getInstance();
    strategy.setSocketIO(undefined);
    const notificacion: Notificacion = {
      mensaje: "msg",
      tipo: "actualizacion",
      timestamp: new Date(),
    };
    await expect(strategy.enviar(notificacion)).rejects.toThrow(
      "Socket.IO no inicializado"
    );
  });

  it("debería emitir notificación por socket", async () => {
    const emit = jest.fn();
    const strategy = WebSocketNotificacionStrategy.getInstance();
    strategy.setSocketIO({ emit });
    const notificacion: Notificacion = {
      mensaje: "msg",
      tipo: "actualizacion",
      timestamp: new Date(),
    };
    await strategy.enviar(notificacion);
    expect(emit).toHaveBeenCalledWith("notificacion", notificacion);
  });
});

describe("ConsoleNotificacionStrategy", () => {
  it("debería imprimir la notificación en consola", async () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    const strategy = new ConsoleNotificacionStrategy();
    const notificacion: Notificacion = {
      mensaje: "msg",
      tipo: "actualizacion",
      timestamp: new Date(),
    };
    await strategy.enviar(notificacion);
    expect(spy).toHaveBeenCalledWith("[ACTUALIZACION] msg");
    spy.mockRestore();
  });
});

describe("PushNotificacionStrategy", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("debería agregar y eliminar suscripciones correctamente", async () => {
    const strategy = PushNotificacionStrategy.getInstance();
    await strategy.addSubscription({
      docenteId: "1",
      subscription: { endpoint: "a" },
    });
    expect(strategy.getActiveSubscriptions("1")).toHaveLength(1);
    await strategy.removeSubscription("1", "a");
    expect(strategy.getActiveSubscriptions("1")).toHaveLength(0);
  });

  it("no debería agregar suscripción inválida", async () => {
    const strategy = PushNotificacionStrategy.getInstance();
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    await strategy.addSubscription({ docenteId: "", subscription: null });
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("debería enviar notificaciones push a suscriptores", async () => {
    const strategy = PushNotificacionStrategy.getInstance();
    const sendNotification = jest
      .spyOn(webpush, "sendNotification")
      .mockResolvedValue(undefined as any);
    await strategy.addSubscription({
      docenteId: "2",
      subscription: { endpoint: "b" },
    });
    const notificacion: Notificacion = {
      mensaje: "msg",
      tipo: "actualizacion",
      timestamp: new Date(),
    };
    await strategy.enviar({ ...notificacion, destinatarios: ["2"] });
    expect(sendNotification).toHaveBeenCalled();
  });

  it("debería limpiar suscripciones expiradas", async () => {
    const strategy = PushNotificacionStrategy.getInstance();
    await strategy.addSubscription({
      docenteId: "3",
      subscription: { endpoint: "c" },
    });
    const sendNotification = jest
      .spyOn(webpush, "sendNotification")
      .mockRejectedValue({ statusCode: 410 });
    await strategy.cleanupExpiredSubscriptions();
    expect(sendNotification).toHaveBeenCalled();
    expect(strategy.getActiveSubscriptions("3")).toHaveLength(0);
  });

  it("debería agregar suscripción inválida y mostrar warning", async () => {
    const strategy = PushNotificacionStrategy.getInstance();
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

    // Caso 1: docenteId vacío
    await strategy.addSubscription({
      docenteId: "",
      subscription: { endpoint: "test" },
    });
    expect(warn).toHaveBeenCalledWith(
      "Intento de agregar suscripción inválida",
      { docenteId: "", subscription: { endpoint: "test" } }
    );

    // Caso 2: subscription null
    await strategy.addSubscription({ docenteId: "123", subscription: null });
    expect(warn).toHaveBeenCalledWith(
      "Intento de agregar suscripción inválida",
      { docenteId: "123", subscription: null }
    );

    warn.mockRestore();
  });

  it("debería eliminar último subscription y borrar la entrada del diccionario", async () => {
    const strategy = PushNotificacionStrategy.getInstance();

    // Agregar una suscripción
    await strategy.addSubscription({
      docenteId: "test-docente",
      subscription: { endpoint: "test-endpoint" },
    });

    expect(strategy.getActiveSubscriptions("test-docente")).toHaveLength(1);

    // Eliminar la única suscripción
    await strategy.removeSubscription("test-docente", "test-endpoint");

    // Debería eliminar la entrada completa del diccionario
    expect(strategy.getActiveSubscriptions("test-docente")).toHaveLength(0);
  });

  it("debería manejar errores 410/404 en envío y limpiar suscripciones", async () => {
    const strategy = PushNotificacionStrategy.getInstance();
    await strategy.addSubscription({
      docenteId: "error-docente",
      subscription: { endpoint: "error-endpoint" },
    });

    const sendNotification = jest
      .spyOn(webpush, "sendNotification")
      .mockRejectedValue({ statusCode: 410 });

    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const removeSubscriptionSpy = jest.spyOn(strategy, "removeSubscription");

    const notificacion: Notificacion = {
      mensaje: "msg",
      tipo: "actualizacion",
      timestamp: new Date(),
    };

    await strategy.enviar({
      ...notificacion,
      destinatarios: ["error-docente"],
    });

    // Debe haber intentado eliminar la suscripción inválida
    expect(removeSubscriptionSpy).toHaveBeenCalledWith(
      "error-docente",
      "error-endpoint"
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      "[webpush] Eliminando suscripción push inválida para",
      "error-docente",
      "error-endpoint"
    );

    sendNotification.mockRestore();
    consoleSpy.mockRestore();
  });

  // Tests adicionales para mejorar branch coverage
  it("debería enviar a todas las suscripciones cuando no hay destinatarios específicos", async () => {
    const strategy = PushNotificacionStrategy.getInstance();
    const sendNotification = jest.fn().mockResolvedValue({ success: true });
    (webpush.sendNotification as jest.Mock) = sendNotification;

    // Limpiar suscripciones previas
    strategy.getActiveSubscriptions = jest.fn().mockReturnValue([]);

    // Agregar múltiples suscripciones simuladas
    await strategy.addSubscription({
      docenteId: "user1",
      subscription: { endpoint: "endpoint1" },
    });
    await strategy.addSubscription({
      docenteId: "user2",
      subscription: { endpoint: "endpoint2" },
    });

    const notificacion: Notificacion = {
      mensaje: "Mensaje para todos",
      tipo: "actualizacion",
      timestamp: new Date(),
    };

    // No especificar destinatarios para cubrir el branch donde destinatarios es undefined
    await strategy.enviar(notificacion);

    expect(sendNotification).toHaveBeenCalled();
  });

  it("debería manejar error no 410/404 en envío (branch de error genérico)", async () => {
    const strategy = PushNotificacionStrategy.getInstance();
    await strategy.addSubscription({
      docenteId: "generic-error",
      subscription: { endpoint: "generic-endpoint" },
    });

    const sendNotification = jest
      .spyOn(webpush, "sendNotification")
      .mockRejectedValue({ statusCode: 500, message: "Server error" });

    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const notificacion: Notificacion = {
      mensaje: "msg",
      tipo: "actualizacion",
      timestamp: new Date(),
    };

    await strategy.enviar({
      ...notificacion,
      destinatarios: ["generic-error"],
    });

    // Debe manejar el error genérico (no 410/404) con el formato correcto
    expect(errorSpy).toHaveBeenCalledWith(
      "[webpush] Error enviando push a",
      "generic-error",
      "generic-endpoint",
      expect.objectContaining({ statusCode: 500 })
    );

    sendNotification.mockRestore();
    errorSpy.mockRestore();
  });

  it("debería manejar destinatarios array vacío sin enviar nada", async () => {
    const strategy = PushNotificacionStrategy.getInstance();
    const sendNotification = jest.fn().mockResolvedValue({ success: true });
    (webpush.sendNotification as jest.Mock) = sendNotification;
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    const notificacion: Notificacion = {
      mensaje: "msg",
      tipo: "actualizacion",
      timestamp: new Date(),
    };

    // Enviar con array de destinatarios vacío (branch diferente a undefined)
    await strategy.enviar({ ...notificacion, destinatarios: [] });

    // Como destinatarios es array vacío [], no debería enviar a nadie
    expect(sendNotification).not.toHaveBeenCalled();
    // Pero debería mostrar el log final con 0 notificaciones
    expect(consoleSpy).toHaveBeenCalledWith(
      "[webpush] Enviadas",
      0,
      "notificaciones push a docentes. Errores:",
      0
    );

    consoleSpy.mockRestore();
  });

  it("debería manejar cleanupExpiredSubscriptions sin suscripciones", async () => {
    const strategy = PushNotificacionStrategy.getInstance();
    // Asegurar que no hay suscripciones
    const originalSubscriptions = (strategy as any).subscriptions;
    (strategy as any).subscriptions = {};

    // No debería lanzar error cuando no hay suscripciones
    await expect(strategy.cleanupExpiredSubscriptions()).resolves.not.toThrow();

    // Restaurar
    (strategy as any).subscriptions = originalSubscriptions;
  });

  // Tests adicionales para mejorar branch coverage específico
  it("debería manejar removeSubscription cuando el docente no existe (línea 80)", async () => {
    const strategy = PushNotificacionStrategy.getInstance();
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    // Intentar eliminar suscripción de docente que no existe
    await strategy.removeSubscription(
      "docente-inexistente",
      "endpoint-cualquiera"
    );

    // No debe hacer nada y no lanzar error
    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("debería manejar mensaje sin nombre de docente en regex (línea 93)", async () => {
    const strategy = PushNotificacionStrategy.getInstance();
    const sendNotification = jest.fn().mockResolvedValue({ success: true });
    (webpush.sendNotification as jest.Mock) = sendNotification;

    // Agregar suscripción
    await strategy.addSubscription({
      docenteId: "test-doc",
      subscription: { endpoint: "test-endpoint" },
    });

<<<<<<< HEAD
    const notificacion: Notificacion = {
      mensaje: "Mensaje sin formato especial", // No tiene formato "Nombre, ..." para fallar el regex
      tipo: "actualizacion",
=======
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
>>>>>>> origin/main
      timestamp: new Date(),
    };

    await strategy.enviar({ ...notificacion, destinatarios: ["test-doc"] });

    // Debe haber usado "Docente" como nombre por defecto cuando el regex falla
    expect(sendNotification).toHaveBeenCalledWith(
      { endpoint: "test-endpoint" },
      expect.stringContaining('"title":"Notificación de Mesa para Docente"')
    );
  });

  it("debería manejar mensaje donde regex encuentra match pero sin capture group", async () => {
    const strategy = PushNotificacionStrategy.getInstance();
    const sendNotification = jest.fn().mockResolvedValue({ success: true });
    (webpush.sendNotification as jest.Mock) = sendNotification;

    // Agregar suscripción
    await strategy.addSubscription({
      docenteId: "test-doc2",
      subscription: { endpoint: "test-endpoint2" },
    });

    const notificacion: Notificacion = {
      mensaje: ", mensaje que empieza con coma", // Match pero capture group vacío
      tipo: "actualizacion",
      timestamp: new Date(),
    };

    await strategy.enviar({ ...notificacion, destinatarios: ["test-doc2"] });

    // Debe haber usado "Docente" como nombre por defecto cuando match[1] es falsy
    expect(sendNotification).toHaveBeenCalledWith(
      { endpoint: "test-endpoint2" },
      expect.stringContaining('"title":"Notificación de Mesa para Docente"')
    );
  });

  it("debería manejar correctamente cuando match[1] existe y tiene valor", async () => {
    const strategy = PushNotificacionStrategy.getInstance();
    const sendNotification = jest.fn().mockResolvedValue({ success: true });
    (webpush.sendNotification as jest.Mock) = sendNotification;

    // Agregar suscripción
    await strategy.addSubscription({
      docenteId: "test-doc3",
      subscription: { endpoint: "test-endpoint3" },
    });

    const notificacion: Notificacion = {
      mensaje: "Juan Pérez, te han asignado una nueva mesa", // Debe extraer "Juan Pérez"
      tipo: "actualizacion",
      timestamp: new Date(),
    };

    await strategy.enviar({ ...notificacion, destinatarios: ["test-doc3"] });

    // Debe haber usado "Juan Pérez" como nombre extraído del regex
    expect(sendNotification).toHaveBeenCalledWith(
      { endpoint: "test-endpoint3" },
      expect.stringContaining('"title":"Notificación de Mesa para Juan Pérez"')
    );
  });

  it("debería manejar caso específico donde match existe pero match[1] es string vacío", async () => {
    const strategy = PushNotificacionStrategy.getInstance();
    const sendNotification = jest.fn().mockResolvedValue({ success: true });
    (webpush.sendNotification as jest.Mock) = sendNotification;

    // Agregar suscripción
    await strategy.addSubscription({
      docenteId: "test-doc4",
      subscription: { endpoint: "test-endpoint4" },
    });

    const notificacion: Notificacion = {
      mensaje: ", hola mundo", // Regex encuentra match pero grupo capturado es string vacío
      tipo: "actualizacion",
      timestamp: new Date(),
    };

    await strategy.enviar({ ...notificacion, destinatarios: ["test-doc4"] });

    // Debe usar "Docente" por defecto cuando match[1] es string vacío
    expect(sendNotification).toHaveBeenCalledWith(
      { endpoint: "test-endpoint4" },
      expect.stringContaining('"title":"Notificación de Mesa para Docente"')
    );
  });

  it("debería ejecutar removeSubscription cuando sí existe el docente", async () => {
    const strategy = PushNotificacionStrategy.getInstance();
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    // Primero agregar una suscripción
    await strategy.addSubscription({
      docenteId: "docente-existente",
      subscription: { endpoint: "endpoint-test" },
    });

    // Luego eliminar la suscripción existente (para cubrir el branch donde SÍ existe)
    await strategy.removeSubscription("docente-existente", "endpoint-test");

    // Debe haber loggeado la eliminación
    expect(consoleSpy).toHaveBeenCalledWith(
      "Suscripción push eliminada para",
      "docente-existente",
      "endpoint-test"
    );

    consoleSpy.mockRestore();
  });
});
