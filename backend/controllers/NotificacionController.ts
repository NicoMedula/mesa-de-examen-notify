import { Request, Response } from 'express';
import { NotificacionService } from '../services/NotificacionService';
import { supabase } from '../config/supabase';
import { getVapidPublicKey } from '../config/webPush';

export class NotificacionController {
  private notificacionService: NotificacionService;

  constructor() {
    this.notificacionService = new NotificacionService();
  }
  
  /**
   * Diagnostica el estado de la configuración de notificaciones push
   */
  public diagnostico = async (req: Request, res: Response): Promise<void> => {
    try {
      // Verificar que existe la clave VAPID
      const publicKey = getVapidPublicKey();
      
      // Verificar si la tabla suscripciones_push existe
      const { data: tableExists, error: tableError } = await supabase
        .from('suscripciones_push')
        .select('id', { count: 'exact', head: true });
      
      // Contar suscripciones
      const { count, error: countError } = await supabase
        .from('suscripciones_push')
        .select('*', { count: 'exact', head: true });
      
      // Resultados del diagnóstico
      res.json({
        estado: 'ok',
        vapid: {
          publicKey,
          configured: !!publicKey
        },
        database: {
          tableExists: tableError ? false : true,
          suscripcionesCount: count || 0,
          error: tableError ? tableError.message : null
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error en diagnóstico de notificaciones:', error);
      res.status(500).json({ 
        estado: 'error', 
        error: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Obtiene la clave pública VAPID para las notificaciones push
   */
  getPublicKey = (req: Request, res: Response): void => {
    try {
      const publicKey = this.notificacionService.getPublicKey();
      res.status(200).json({ publicKey });
    } catch (error: any) {
      console.error('Error al obtener clave pública VAPID:', error);
      res.status(500).json({ error: 'Error al obtener clave pública' });
    }
  };

  /**
   * Registra una suscripción push para un docente
   */
  subscribe = (req: Request, res: Response): void => {
    try {
      const { docenteId, subscription } = req.body;
      
      if (!docenteId || !subscription) {
        res.status(400).json({ error: 'Se requiere docenteId y subscription' });
        return;
      }
      
      this.notificacionService.guardarSuscripcion(docenteId, subscription)
        .then(result => {
          res.status(201).json(result);
        })
        .catch(error => {
          console.error('Error al registrar suscripción:', error);
          res.status(500).json({ error: 'Error al registrar suscripción: ' + error.message });
        });
    } catch (error: any) {
      console.error('Error al procesar solicitud de suscripción:', error);
      res.status(500).json({ error: 'Error interno: ' + error.message });
    }
  };

  /**
   * Envía una notificación push a un docente específico
   */
  enviarNotificacion = (req: Request, res: Response): void => {
    try {
      const { docenteId, titulo, mensaje } = req.body;
      
      if (!docenteId) {
        res.status(400).json({ error: 'Se requiere docenteId' });
        return;
      }
      
      // Formatear el mensaje para que coincida con lo que espera el service worker
      const notificacionPayload = {
        title: titulo || 'Notificación',
        body: mensaje || 'Tienes un nuevo mensaje',
        tag: `docente-${docenteId}`,
        icon: '/favicon.ico',
        // La URL a la que se redirigirá al hacer clic
        url: '/docente-dashboard',
        requireInteraction: true
      };
      
      console.log('Enviando notificación con payload:', JSON.stringify(notificacionPayload));
      
      this.notificacionService.enviarNotificacionADocente(docenteId, notificacionPayload)
        .then(() => {
          res.status(200).json({ success: true, message: 'Notificación enviada correctamente' });
        })
        .catch(error => {
          console.error('Error al enviar notificación:', error);
          res.status(500).json({ error: 'Error al enviar notificación: ' + error.message });
        });
    } catch (error: any) {
      console.error('Error al procesar solicitud de notificación:', error);
      res.status(500).json({ error: 'Error interno: ' + error.message });
    }
  };

  /**
   * Envía una notificación push a todos los docentes suscritos
   */
  enviarNotificacionATodos = (req: Request, res: Response): void => {
    try {
      const { mensaje } = req.body;
      
      if (!mensaje) {
        res.status(400).json({ error: 'Se requiere un mensaje' });
        return;
      }
      
      this.notificacionService.enviarNotificacionATodos(mensaje)
        .then(resultado => {
          res.status(200).json({ 
            success: true, 
            message: 'Notificaciones enviadas',
            resultado
          });
        })
        .catch(error => {
          console.error('Error al enviar notificación a todos:', error);
          res.status(500).json({ error: 'Error al enviar notificación: ' + error.message });
        });
    } catch (error: any) {
      console.error('Error al procesar solicitud de notificación masiva:', error);
      res.status(500).json({ error: 'Error interno: ' + error.message });
    }
  };

  /**
   * Envía una notificación relacionada con una mesa de examen
   */
  notificarMesaExamen = (req: Request, res: Response): void => {
    try {
      const { mesaId, docentesIds, mensaje } = req.body;
      
      if (!mesaId || !docentesIds || !mensaje) {
        res.status(400).json({ error: 'Se requiere mesaId, docentesIds y mensaje' });
        return;
      }
      
      this.notificacionService.notificarMesaExamen(mesaId, docentesIds, mensaje)
        .then(resultado => {
          res.status(200).json({ 
            success: true, 
            message: 'Notificaciones de mesa enviadas',
            resultado
          });
        })
        .catch(error => {
          console.error('Error al notificar mesa de examen:', error);
          res.status(500).json({ error: 'Error al notificar mesa de examen: ' + error.message });
        });
    } catch (error: any) {
      console.error('Error al procesar solicitud de notificación de mesa:', error);
      res.status(500).json({ error: 'Error interno: ' + error.message });
    }
  };
}
