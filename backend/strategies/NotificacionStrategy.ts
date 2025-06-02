import { Notificacion } from "../factories/NotificacionFactory";
import webpush from "web-push";
import { supabase } from "../config/supabase";

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
  // Diccionario de arrays de suscripciones por docenteId (solo en memoria)
  private subscriptions: { [docenteId: string]: any[] } = {};

  private constructor() {}

  public static getInstance(): PushNotificacionStrategy {
    if (!PushNotificacionStrategy.instance) {
      PushNotificacionStrategy.instance = new PushNotificacionStrategy();
    }
    return PushNotificacionStrategy.instance;
  }

  public async addSubscription({ docenteId, subscription }: { docenteId: string; subscription: any }) {
    if (!docenteId || !subscription) {
      console.warn("Intento de agregar suscripción inválida", { docenteId, subscription });
      return;
    }
    if (!this.subscriptions[docenteId]) {
      this.subscriptions[docenteId] = [];
    }
    // Evitar duplicados por endpoint
    if (!this.subscriptions[docenteId].some(s => s.endpoint === subscription.endpoint)) {
      this.subscriptions[docenteId].push(subscription);
      console.log("Suscripción push agregada en memoria para", docenteId, subscription.endpoint);
    }
  }

  public async removeSubscription(docenteId: string, endpoint: string) {
    if (!this.subscriptions[docenteId]) {
      return;
    }
    this.subscriptions[docenteId] = this.subscriptions[docenteId].filter(s => s.endpoint !== endpoint);
    if (this.subscriptions[docenteId].length === 0) {
      delete this.subscriptions[docenteId];
    }
    console.log("Suscripción push eliminada para", docenteId, endpoint);
  }

  public getActiveSubscriptions(docenteId?: string) {
    if (docenteId) {
      return this.subscriptions[docenteId] || [];
    }
    return this.subscriptions;
  }

  public async cleanupExpiredSubscriptions() {
    for (const [docenteId, subs] of Object.entries(this.subscriptions)) {
      for (const sub of subs) {
        try {
          // Intentar enviar una notificación de prueba
          await webpush.sendNotification(sub, JSON.stringify({ title: "Test", body: "Test" }));
        } catch (err: any) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            console.log("[webpush] Limpiando suscripción expirada para", docenteId, sub.endpoint);
            await this.removeSubscription(docenteId, sub.endpoint);
          }
        }
      }
    }
  }

  public async enviar(notificacion: Notificacion & { destinatarios?: string[] }) {
    const destinatarios = notificacion.destinatarios || Object.keys(this.subscriptions);
    let total = 0;
    let errores = 0;

    for (const docenteId of destinatarios) {
      const subs = this.subscriptions[docenteId] || [];
      for (const sub of subs) {
        try {
          let nombreDocente = "Docente";
          const match = notificacion.mensaje.match(/^(.*?),/);
          if (match && match[1]) nombreDocente = match[1];
          const payload = {
            title: `Notificación de Mesa para ${nombreDocente}`,
            body: notificacion.mensaje,
            docenteId,
            url: "/",
          };
          console.log("[webpush] Enviando a:", sub.endpoint);
          console.log("[webpush] Payload:", payload);
          await webpush.sendNotification(sub, JSON.stringify(payload));
          console.log("[webpush] Notificación enviada correctamente a:", sub.endpoint);
          total++;
        } catch (err: any) {
          console.error("[webpush] Error enviando push a", docenteId, sub.endpoint, err);
          errores++;
          if (err.statusCode === 410 || err.statusCode === 404) {
            console.log("[webpush] Eliminando suscripción push inválida para", docenteId, sub.endpoint);
            await this.removeSubscription(docenteId, sub.endpoint);
          }
        }
      }
    }
    console.log("[webpush] Enviadas", total, "notificaciones push a docentes. Errores:", errores);
  }
}
