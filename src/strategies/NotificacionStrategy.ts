import { Notificacion } from "../factories/NotificacionFactory";
import webpush from 'web-push';

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

export class PushNotificacionStrategy implements NotificacionStrategy {
  private static instance: PushNotificacionStrategy;
  private subscriptions: any[] = [];

  private constructor() {}

  public static getInstance(): PushNotificacionStrategy {
    if (!PushNotificacionStrategy.instance) {
      PushNotificacionStrategy.instance = new PushNotificacionStrategy();
    }
    return PushNotificacionStrategy.instance;
  }

  public addSubscription(subscription: any) {
    this.subscriptions.push(subscription);
  }

  public async enviar(notificacion: Notificacion): Promise<void> {
    console.log('Enviando notificación push a', this.subscriptions.length, 'suscriptores');
    for (const sub of this.subscriptions) {
      try {
        await webpush.sendNotification(
          sub,
          JSON.stringify({
            title: 'Notificación de Mesa',
            body: notificacion.mensaje,
            url: '/' // Puedes personalizar la URL
          })
        );
      } catch (err) {
        console.error('Error enviando push:', err);
      }
    }
  }
}
