import webpush, { getVapidPublicKey } from '../config/webPush';
import { NotificacionRepository } from '../repositories/NotificacionRepository';
import { PushSubscription } from 'web-push';

export class NotificacionService {
  private notificacionRepository: NotificacionRepository;

  constructor() {
    this.notificacionRepository = new NotificacionRepository();
  }

  /**
   * Obtiene la clave pública VAPID para la suscripción de notificaciones push
   */
  getPublicKey(): string {
    return getVapidPublicKey();
  }

  /**
   * Guarda una suscripción push para un docente
   */
  async guardarSuscripcion(docenteId: string, subscription: PushSubscription) {
    try {
      console.log(`Guardando suscripción push para docente ${docenteId}`);
      return await this.notificacionRepository.guardarSuscripcion(docenteId, subscription);
    } catch (error) {
      console.error('Error al guardar suscripción push:', error);
      throw error;
    }
  }

  /**
   * Envía una notificación push a un docente específico
   */
  async enviarNotificacionADocente(docenteId: string, mensaje: any) {
    try {
      console.log(`Enviando notificación push a docente ${docenteId}`);
      
      const suscripcion = await this.notificacionRepository.obtenerSuscripcionPorDocente(docenteId);
      if (!suscripcion) {
        throw new Error(`No hay suscripción push registrada para el docente ${docenteId}`);
      }
      
      return await this.enviarNotificacion(suscripcion.subscription, mensaje);
    } catch (error) {
      console.error(`Error al enviar notificación a docente ${docenteId}:`, error);
      throw error;
    }
  }

  /**
   * Envía una notificación push a todos los docentes suscritos
   */
  async enviarNotificacionATodos(mensaje: any) {
    try {
      console.log('Enviando notificación push a todos los docentes');
      
      const suscripciones = await this.notificacionRepository.obtenerTodasSuscripciones();
      console.log(`Enviando a ${suscripciones.length} suscripciones`);
      
      const resultados = await Promise.allSettled(
        suscripciones.map(sub => this.enviarNotificacion(sub.subscription, mensaje))
      );
      
      // Contar éxitos y fallos
      const exitos = resultados.filter(r => r.status === 'fulfilled').length;
      const fallos = resultados.filter(r => r.status === 'rejected').length;
      
      console.log(`Notificaciones enviadas: ${exitos} exitosas, ${fallos} fallidas`);
      
      return { total: suscripciones.length, exitos, fallos };
    } catch (error) {
      console.error('Error al enviar notificación a todos:', error);
      throw error;
    }
  }

  /**
   * Envía una notificación push a una suscripción específica
   */
  private async enviarNotificacion(subscription: PushSubscription, mensaje: any) {
    try {
      // Asegurarse de que el mensaje es un objeto para convertirlo a JSON
      const payload = JSON.stringify(mensaje);
      
      // Opciones de envío
      const options = {
        TTL: 7200, // Tiempo de vida de la notificación en segundos (2 horas)
      };
      
      // Enviar la notificación
      console.log('Enviando notificación con payload:', payload);
      return await webpush.sendNotification(subscription, payload, options);
    } catch (error: any) {
      console.error('Error al enviar notificación push:', error);
      
      // Si el error es porque la suscripción ya no es válida, podríamos eliminarla
      if (error.statusCode === 410) {
        console.log('Suscripción expirada o inválida, se debería eliminar');
        // Aquí se podría implementar la lógica para eliminar suscripciones inválidas
      }
      
      throw error;
    }
  }

  /**
   * Envía una notificación de mesa de examen a docentes asignados
   */
  async notificarMesaExamen(mesaId: string, docentesIds: string[], mensaje: any) {
    try {
      console.log(`Notificando mesa de examen ${mesaId} a ${docentesIds.length} docentes`);
      
      // Preparar el mensaje con información de la mesa
      const mensajeMesa = {
        ...mensaje,
        data: {
          ...mensaje.data,
          mesaId,
          timestamp: new Date().toISOString()
        }
      };
      
      // Enviar a cada docente
      const resultados = await Promise.allSettled(
        docentesIds.map(docenteId => this.enviarNotificacionADocente(docenteId, mensajeMesa))
      );
      
      // Contar éxitos y fallos
      const exitos = resultados.filter(r => r.status === 'fulfilled').length;
      const fallos = resultados.filter(r => r.status === 'rejected').length;
      
      console.log(`Notificaciones de mesa enviadas: ${exitos} exitosas, ${fallos} fallidas`);
      
      return { total: docentesIds.length, exitos, fallos };
    } catch (error) {
      console.error('Error al notificar mesa de examen:', error);
      throw error;
    }
  }
}
