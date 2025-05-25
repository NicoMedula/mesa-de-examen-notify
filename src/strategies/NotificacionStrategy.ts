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
  // Ahora es un diccionario de arrays de suscripciones por docenteId
  private subscriptions: { [docenteId: string]: any[] } = {};

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
    if (!this.subscriptions[docenteId]) {
      this.subscriptions[docenteId] = [];
    }
    // Evitar duplicados (por endpoint)
    const exists = this.subscriptions[docenteId].some((sub) => sub.endpoint === subscription.endpoint);
    if (!exists) {
      this.subscriptions[docenteId].push(subscription);
    }
  }

  // Enviar solo a los docentes indicados, a todos sus dispositivos
  public async enviar(notificacion: Notificacion & { destinatarios?: string[] }) {
    const destinatarios = notificacion.destinatarios || Object.keys(this.subscriptions);
    let total = 0;
    for (const docenteId of destinatarios) {
      const subs = this.subscriptions[docenteId] || [];
      for (const sub of subs) {
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
          total++;
        } catch (err) {
          console.error('Error enviando push a', docenteId, err);
        }
      }
    }
    console.log('Enviadas', total, 'notificaciones push a docentes.');
  }
}
