import { supabase } from '../config/supabase';
import { PushSubscription } from 'web-push';

export interface SubscripcionPush {
  id?: string;
  docenteId: string;
  subscription: PushSubscription;
  createdAt?: string;
  updatedAt?: string;
}

export class NotificacionRepository {
  private static instance: NotificacionRepository;
  private tableName = 'suscripciones_push';

  // Implementación del patrón Singleton
  public static getInstance(): NotificacionRepository {
    if (!NotificacionRepository.instance) {
      NotificacionRepository.instance = new NotificacionRepository();
    }
    return NotificacionRepository.instance;
  }

  /**
   * Guarda o actualiza una suscripción push para un docente
   */
  async guardarSuscripcion(docenteId: string, subscription: PushSubscription): Promise<SubscripcionPush> {
    // Verificar si ya existe una suscripción para este docente
    const { data: existingSub } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('docenteId', docenteId)
      .maybeSingle();

    const timestamp = new Date().toISOString();
    
    if (existingSub) {
      // Actualizar la suscripción existente
      const { data, error } = await supabase
        .from(this.tableName)
        .update({
          subscription,
          updatedAt: timestamp
        })
        .eq('id', existingSub.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error al actualizar suscripción push:', error);
        throw new Error(`Error al actualizar suscripción: ${error.message}`);
      }
      
      return data;
    } else {
      // Crear una nueva suscripción
      const { data, error } = await supabase
        .from(this.tableName)
        .insert({
          docenteId,
          subscription,
          createdAt: timestamp,
          updatedAt: timestamp
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error al crear suscripción push:', error);
        throw new Error(`Error al crear suscripción: ${error.message}`);
      }
      
      return data;
    }
  }

  /**
   * Elimina una suscripción push para un docente
   */
  /**
   * Elimina una suscripción push para un docente
   */
  async eliminarSuscripcion(docenteId: string, endpoint?: string): Promise<void> {
    let query = supabase
      .from(this.tableName)
      .delete()
      .eq('docenteId', docenteId);
    
    // Si se proporciona un endpoint, filtrar también por él
    if (endpoint) {
      // Usar LIKE para encontrar el endpoint en el objeto JSON
      query = query.like('subscription->endpoint', `%${endpoint}%`);
    }
    
    const { error } = await query;
    
    if (error) {
      console.error('Error al eliminar suscripción push:', error);
      throw new Error(`Error al eliminar suscripción: ${error.message}`);
    }
  }

  /**
   * Obtiene todas las suscripciones push
   */
  async obtenerTodasSuscripciones(): Promise<SubscripcionPush[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*');

    
    if (error) {
      console.error('Error al obtener suscripciones push:', error);
      throw new Error(`Error al obtener suscripciones: ${error.message}`);
    }
    
    return data || [];
  }

  /**
   * Obtiene la suscripción push para un docente específico
   */
  async obtenerSuscripcionPorDocente(docenteId: string): Promise<SubscripcionPush | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('docenteId', docenteId)
      .maybeSingle();
    
    if (error) {
      console.error('Error al obtener suscripción push:', error);
      throw new Error(`Error al obtener suscripción: ${error.message}`);
    }
    
    return data;
  }

  /**
   * Obtiene todas las suscripciones push de un docente
   */
  async obtenerSuscripcionesByDocente(docenteId: string): Promise<SubscripcionPush[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('docenteId', docenteId);
    
    if (error) {
      console.error('Error al obtener suscripciones push:', error);
      throw new Error(`Error al obtener suscripciones: ${error.message}`);
    }
    
    return data || [];
  }

  /**
   * Obtiene los IDs de todos los docentes que tienen suscripciones push
   */
  async obtenerTodosDocentesConSuscripciones(): Promise<string[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('docenteId')
      .order('docenteId');
    
    if (error) {
      console.error('Error al obtener docentes con suscripciones:', error);
      throw new Error(`Error al obtener docentes: ${error.message}`);
    }
    
    // Extraer IDs únicos
    const uniqueIds = [...new Set(data?.map(item => item.docenteId))];
    return uniqueIds || [];
  }
}
