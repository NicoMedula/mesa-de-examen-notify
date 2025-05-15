import { Notificacion } from "../factories/NotificacionFactory";

// Patrón Strategy: Permite cambiar la forma de enviar notificaciones
export interface NotificacionStrategy {
  enviar(notificacion: Notificacion): Promise<void>;
}

interface SocketIO {
  emit: (event: string, ...args: unknown[]) => void;
}

// Patrón Singleton: Única instancia de WebSocketNotificacionStrategy
export class WebSocketNotificacionStrategy implements NotificacionStrategy {
  private static instance: WebSocketNotificacionStrategy;
  private io: SocketIO | undefined;

  private constructor() {
    // Constructor vacío intencionalmente para Singleton
  }

  public static getInstance(): WebSocketNotificacionStrategy {
    if (!WebSocketNotificacionStrategy.instance) {
      WebSocketNotificacionStrategy.instance =
        new WebSocketNotificacionStrategy();
    }
    return WebSocketNotificacionStrategy.instance;
  }
//Permite inyectar la instancia real de Socket.IO desde afuera
  public setSocketIO(io: SocketIO | undefined): void {
    this.io = io;
  }

  public async enviar(notificacion: Notificacion): Promise<void> {
    if (!this.io) {
      throw new Error("Socket.IO no inicializado");
    }
    this.io.emit("notificacion", notificacion);
  }
}

export class ConsoleNotificacionStrategy implements NotificacionStrategy {
  public async enviar(notificacion: Notificacion): Promise<void> {
    console.log(`[${notificacion.tipo.toUpperCase()}] ${notificacion.mensaje}`);
  }
}
