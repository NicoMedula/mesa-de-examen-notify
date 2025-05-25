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
    this.notificacionStrategy = WebSocketNotificacionStrategy.getInstance();
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
      await this.notificacionStrategy.enviar(notificacion);
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
    const destinatarios = mesa.docentes.map(d => d.id);
    const notificacion = {
      ...NotificacionFactory.crearNotificacionActualizacion(mesa, 'Se te ha asignado una nueva mesa'),
      destinatarios
    };
    await PushNotificacionStrategy.getInstance().enviar(notificacion);
    // ... lógica original ...
    return this.mesaRepository.createMesa(mesa);
  }

  public async updateMesa(
    mesaId: string,
    mesaActualizada: Partial<Mesa>
  ): Promise<Mesa> {
    const mesa = await this.mesaRepository.updateMesa(mesaId, mesaActualizada);
    // Notificación push para confirmación o cancelación SOLO a docentes asignados
    let mensaje = '';
    if (mesaActualizada.estado === 'confirmada') {
      mensaje = 'La mesa ha sido confirmada por el departamento.';
    } else if (mesaActualizada.estado === 'pendiente') {
      mensaje = 'La mesa ha sido cancelada y vuelve a estado pendiente.';
    }
    if (mensaje) {
      const destinatarios = mesa.docentes.map(d => d.id);
      const notificacion = {
        ...NotificacionFactory.crearNotificacionActualizacion(mesa, mensaje),
        destinatarios
      };
      await PushNotificacionStrategy.getInstance().enviar(notificacion);
    }
    return mesa;
  }

  public async deleteMesa(mesaId: string): Promise<void> {
    return this.mesaRepository.deleteMesa(mesaId);
  }

  public async getAllMesas(): Promise<Mesa[]> {
    return this.mesaRepository.getAllMesas();
  }
}
