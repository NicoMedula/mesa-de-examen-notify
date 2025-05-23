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
  // Cambiamos a un diccionario por docenteId
  private subscriptions: { [docenteId: string]: any } = {};

  private constructor() {}

  public static getInstance(): PushNotificacionStrategy {
    if (!PushNotificacionStrategy.instance) {
      PushNotificacionStrategy.instance = new PushNotificacionStrategy();
    }
    return PushNotificacionStrategy.instance;
  }

  // Recibe { docenteId, subscription }
  public addSubscription({ docenteId, subscription }: { docenteId: string, subscription: any }) {
    if (!docenteId || !subscription) return;
    // Evitar duplicados: solo una suscripción por docenteId
    this.subscriptions[docenteId] = subscription;
  }

  // Enviar solo a los docentes indicados
  public async enviar(notificacion: Notificacion & { destinatarios?: string[] }) {
    const destinatarios = notificacion.destinatarios || Object.keys(this.subscriptions);
    console.log('Enviando notificación push a', destinatarios.length, 'docentes');
    for (const docenteId of destinatarios) {
      const sub = this.subscriptions[docenteId];
      if (!sub) continue;
      try {
        await webpush.sendNotification(
          sub,
          JSON.stringify({
            title: 'Notificación de Mesa',
            body: notificacion.mensaje,
            docenteId,
            url: '/'
          })
        );
      } catch (err) {
        console.error('Error enviando push a', docenteId, err);
      }
    }
  }
}
