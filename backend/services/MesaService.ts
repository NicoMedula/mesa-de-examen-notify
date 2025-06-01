import { Mesa } from "../types";
import { MesaRepository } from "../repositories/MesaRepository";
import { NotificacionFactory } from "../factories/NotificacionFactory";
// Se importa la interfaz que define el contrato para cualquier estrategia de notificación
import {
  NotificacionStrategy,
  WebSocketNotificacionStrategy,
  PushNotificacionStrategy,
} from "../strategies/NotificacionStrategy";

// Patrón Singleton: Única instancia de MesaService
// Patrón Strategy: Permite cambiar la estrategia de notificación
// Patrón Dependency Injection: Se puede inyectar la estrategia deseada
export class MesaService {
  private static instance: MesaService;
  private mesaRepository: MesaRepository;
  // La estrategia se declara con el tipo de la interfaz, no una clase concreta
  // Esto permite inyectar diferentes implementaciones
  private notificacionStrategy: NotificacionStrategy;

  private constructor() {
    this.mesaRepository = MesaRepository.getInstance();
    // Inicialmente se asigna una estrategia por defecto, pero esto puede cambiarse más adelante
    // Usamos PushNotificacionStrategy como estrategia predeterminada para asegurar que las notificaciones funcionen
    this.notificacionStrategy = PushNotificacionStrategy.getInstance();
  }

  public static getInstance(): MesaService {
    if (!MesaService.instance) {
      MesaService.instance = new MesaService();
    }
    return MesaService.instance;
  }

  // metodo que permite inyectar una estrategia externa en tiempo de ejecucion.
  // se aplica explicitamente la inyeccion de dependencias
  public setNotificacionStrategy(strategy: NotificacionStrategy): void {
    this.notificacionStrategy = strategy;
  }

  public async getMesasByDocenteId(docenteId: string): Promise<Mesa[]> {
    return this.mesaRepository.getMesasByDocenteId(docenteId);
  }

  public async confirmarMesa(
    mesaId: string,
    docenteId: string,
    confirmacion: import("../types").EstadoConfirmacion
  ): Promise<Mesa> {
    const mesa = await this.mesaRepository.updateConfirmacion(
      mesaId,
      docenteId,
      confirmacion
    );
    const docente = mesa.docentes.find((d) => d.id === docenteId);

    if (docente) {
      const notificacion = NotificacionFactory.crearNotificacionConfirmacion(
        mesa,
        docente
      );
      
      // Aseguramos que se envíe la notificación usando la estrategia actual
      await this.notificacionStrategy.enviar(notificacion);
      
      // Siempre enviamos la notificación push además de la estrategia actual
      const pushStrategy = PushNotificacionStrategy.getInstance();
      const notificacionPush = {
        ...notificacion,
        destinatarios: mesa.docentes.map(d => d.id).filter(id => id !== docenteId) // Notificar a todos los demás docentes
      };
      await pushStrategy.enviar(notificacionPush);
    }

    return mesa;
  }

  public async enviarRecordatorio(mesaId: string): Promise<void> {
    const mesas = await this.mesaRepository.getAllMesas();
    const mesa = mesas.find((m) => m.id === mesaId);

    if (mesa) {
      const notificacion =
        NotificacionFactory.crearNotificacionRecordatorio(mesa);
      await this.notificacionStrategy.enviar(notificacion);
    }
  }

  public async createMesa(mesa: Mesa): Promise<Mesa> {
    // Notificar a los docentes asignados
    for (const docente of mesa.docentes) {
      const mensaje = `${docente.nombre}, el departamento te ha asignado una nueva mesa.`;
      const notificacion = {
        ...NotificacionFactory.crearNotificacionActualizacion(mesa, mensaje),
        destinatarios: [docente.id],
      };
      const payload = {
        title: `Notificación de Mesa para ${docente.nombre}`,
        body: notificacion.mensaje,
        docenteId: docente.id,
        url: "/",
      };
      console.log("Payload enviado a webpush (createMesa):", payload);
      await PushNotificacionStrategy.getInstance().enviar(notificacion);
    }
    // ... lógica original ...
    return this.mesaRepository.createMesa(mesa);
  }

  public async updateMesa(
    mesaId: string,
    mesaActualizada: Partial<Mesa>
  ): Promise<Mesa> {
    const mesa = await this.mesaRepository.updateMesa(mesaId, mesaActualizada);
    // Notificación push para confirmación o cancelación SOLO a docentes asignados
    let mensaje = "";
    if (mesaActualizada.estado === "confirmada") {
      mensaje = "el departamento ha confirmado la mesa.";
    } else if (mesaActualizada.estado === "pendiente") {
      mensaje =
        "el departamento ha cancelado la mesa (vuelve a estado pendiente).";
    }
    if (mensaje) {
      for (const docente of mesa.docentes) {
        const mensajePersonalizado = `${docente.nombre}, ${mensaje}`;
        const notificacion = {
          ...NotificacionFactory.crearNotificacionActualizacion(
            mesa,
            mensajePersonalizado
          ),
          destinatarios: [docente.id],
        };
        const payload = {
          title: `Notificación de Mesa para ${docente.nombre}`,
          body: notificacion.mensaje,
          docenteId: docente.id,
          url: "/",
        };
        console.log("Payload enviado a webpush (updateMesa):", payload);
        await PushNotificacionStrategy.getInstance().enviar(notificacion);
      }
    }
    return mesa;
  }

  public async deleteMesa(mesaId: string): Promise<void> {
    return this.mesaRepository.deleteMesa(mesaId);
  }

  public async getAllMesas(): Promise<Mesa[]> {
    return this.mesaRepository.getAllMesas();
  }

  /**
   * Obtiene una mesa específica por su ID
   * @param mesaId ID de la mesa a obtener
   * @returns La mesa encontrada o null si no existe
   */
  public async getMesaById(mesaId: string): Promise<Mesa | null> {
    try {
      console.log(`[MesaService.getMesaById] Obteniendo mesa con ID ${mesaId}`);
      const mesas = await this.getAllMesas();
      const mesa = mesas.find(m => m.id === mesaId);
      
      if (!mesa) {
        console.log(`[MesaService.getMesaById] No se encontró la mesa con ID ${mesaId}`);
        return null;
      }
      
      console.log(`[MesaService.getMesaById] Mesa encontrada: ${JSON.stringify(mesa, null, 2)}`);
      return mesa;
    } catch (error) {
      console.error(`[MesaService.getMesaById] Error al obtener mesa ${mesaId}:`, error);
      throw error;
    }
  }
}
