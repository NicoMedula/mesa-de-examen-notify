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
      tipo: "recordatorio",
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
      tipo: "recordatorio",
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
      tipo: "recordatorio",
      timestamp: new Date(),
    };
    await strategy.enviar(notificacion);
    expect(spy).toHaveBeenCalledWith("[RECORDATORIO] msg");
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
      tipo: "recordatorio",
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
});
