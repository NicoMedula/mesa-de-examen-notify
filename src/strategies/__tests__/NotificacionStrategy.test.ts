import {
  WebSocketNotificacionStrategy,
  ConsoleNotificacionStrategy,
} from "../NotificacionStrategy";
import { Notificacion } from "../../factories/NotificacionFactory";

describe("NotificacionStrategy", () => {
  const notificacion: Notificacion = {
    mensaje: "Test",
    tipo: "confirmacion",
    timestamp: new Date(),
  };

  it("debería lanzar error si Socket.IO no está inicializado", async () => {
    const wsStrategy = WebSocketNotificacionStrategy.getInstance();
    wsStrategy.setSocketIO(undefined);
    await expect(wsStrategy.enviar(notificacion)).rejects.toThrow(
      "Socket.IO no inicializado"
    );
  });

  it("debería imprimir en consola con ConsoleNotificacionStrategy", async () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();
    const consoleStrategy = new ConsoleNotificacionStrategy();
    await consoleStrategy.enviar(notificacion);
    expect(consoleSpy).toHaveBeenCalledWith("[CONFIRMACION] Test");
    consoleSpy.mockRestore();
  });

  it("debería emitir notificación por WebSocket si Socket.IO está inicializado", async () => {
    const wsStrategy = WebSocketNotificacionStrategy.getInstance();
    const emitMock = jest.fn();
    wsStrategy.setSocketIO({ emit: emitMock });
    await wsStrategy.enviar(notificacion);
    expect(emitMock).toHaveBeenCalledWith("notificacion", notificacion);
  });
});
