import { Notificacion } from "../factories/NotificacionFactory";
import webpush from "web-push";
import { NotificacionService } from "../services/NotificacionService";
import { NotificacionRepository } from "../repositories/NotificacionRepository";

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
  private notificacionService: NotificacionService;
  private notificacionRepository: NotificacionRepository;
  // Mantenemos un caché en memoria para evitar consultas repetidas a la BD
  private cache: { [docenteId: string]: any[] } = {};
  private cacheValidUntil: Date = new Date();

  private constructor() {
    this.notificacionService = new NotificacionService();
    this.notificacionRepository = NotificacionRepository.getInstance();
    // Caché válida por 5 minutos
    this.cacheValidUntil = new Date(Date.now() + 5 * 60 * 1000);
  }

  public static getInstance(): PushNotificacionStrategy {
    if (!PushNotificacionStrategy.instance) {
      PushNotificacionStrategy.instance = new PushNotificacionStrategy();
    }
    return PushNotificacionStrategy.instance;
  }

  // Añade suscripción tanto en memoria como en BD
  public async addSubscription({
    docenteId,
    subscription,
  }: {
    docenteId: string;
    subscription: any;
  }) {
    try {
      if (!docenteId || !subscription) return;
      
      // Guardar en BD usando el repositorio
      await this.notificacionRepository.guardarSuscripcion(docenteId, subscription);
      
      // Actualizar la caché en memoria
      if (!this.cache[docenteId]) {
        this.cache[docenteId] = [];
      }
      
      // Evitar duplicados en caché (por endpoint)
      const exists = this.cache[docenteId].some(
        (sub) => sub.endpoint === subscription.endpoint
      );
      
      if (!exists) {
        this.cache[docenteId].push(subscription);
      }
      
      console.log(`Suscripción guardada para docente ${docenteId}`);
    } catch (error) {
      console.error("Error al guardar suscripción:", error);
    }
  }

  // Obtiene todas las suscripciones de un docente desde la BD
  private async getSuscripcionesByDocente(docenteId: string): Promise<any[]> {
    try {
      // Verificar si el caché es válido
      const now = new Date();
      if (now > this.cacheValidUntil || !this.cache[docenteId]) {
        // Caché inválido, recargar desde BD
        const suscripciones = await this.notificacionRepository.obtenerSuscripcionesByDocente(docenteId);
        this.cache[docenteId] = suscripciones.map((item: { subscription: any }) => item.subscription);
        
        // Renovar validez del caché
        this.cacheValidUntil = new Date(Date.now() + 5 * 60 * 1000);
      }
      
      return this.cache[docenteId] || [];
    } catch (error) {
      console.error(`Error al obtener suscripciones para docente ${docenteId}:`, error);
      return [];
    }
  }

  // Enviar notificaciones usando el nuevo servicio
  public async enviar(
    notificacion: Notificacion & { destinatarios?: string[] }
  ) {
    try {
      const destinatarios = notificacion.destinatarios || [];
      
      // Si no hay destinatarios específicos, obtener todos los docentes con suscripciones
      if (destinatarios.length === 0) {
        const todosDocentes = await this.notificacionRepository.obtenerTodosDocentesConSuscripciones();
        destinatarios.push(...todosDocentes);
      }
      
      console.log(`Enviando notificación a ${destinatarios.length} destinatarios`);
      
      let total = 0;
      for (const docenteId of destinatarios) {
        // Obtener suscripciones desde BD para cada docente
        const suscripciones = await this.getSuscripcionesByDocente(docenteId);
        console.log(`Docente ${docenteId} tiene ${suscripciones.length} suscripciones`);
        
        for (const subscription of suscripciones) {
          try {
            // Extraer nombre del docente del mensaje si está disponible
            let nombreDocente = "";
            const match = notificacion.mensaje.match(/^(.*?),/);
            if (match && match[1]) {
              nombreDocente = match[1];
            } else {
              nombreDocente = "Docente";
            }
            
            const payload = {
              title: `Notificación de Mesa para ${nombreDocente}`,
              body: notificacion.mensaje,
              docenteId,
              url: "/",
              icon: "/logo192.png", // Ícono para la notificación
              badge: "/logo192.png", // Badge para dispositivos móviles
              timestamp: Date.now() // Para ordenar notificaciones
            };
            
            console.log(`Enviando notificación push a ${docenteId}`);
            await webpush.sendNotification(subscription, JSON.stringify(payload));
            total++;
          } catch (error: any) {
            console.error(`Error enviando notificación a ${docenteId}:`, error);
            
            // Si la suscripción ya no es válida (error 410), eliminarla
            if (error.statusCode === 410) {
              console.log(`Eliminando suscripción inválida para ${docenteId}`);
              await this.notificacionRepository.eliminarSuscripcion(docenteId, subscription.endpoint);
              
              // Actualizar caché
              if (this.cache[docenteId]) {
                this.cache[docenteId] = this.cache[docenteId].filter(
                  sub => sub.endpoint !== subscription.endpoint
                );
              }
            }
          }
        }
      }
      
      console.log(`Enviadas ${total} notificaciones push`);
    } catch (error) {
      console.error("Error general al enviar notificaciones push:", error);
    }
  }
}
