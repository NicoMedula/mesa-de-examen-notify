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

    const notificacion: Notificacion = {
      mensaje: "Mensaje sin formato especial", // No tiene formato "Nombre, ..." para fallar el regex
      tipo: "actualizacion",
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
