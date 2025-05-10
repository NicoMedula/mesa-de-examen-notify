import { Mesa } from "../types";
import { MesaRepository } from "../repositories/MesaRepository";
import { NotificacionFactory } from "../factories/NotificacionFactory";
import {
  NotificacionStrategy,
  WebSocketNotificacionStrategy,
} from "../strategies/NotificacionStrategy";

// Patrón Singleton: Única instancia de MesaService
// Patrón Strategy: Permite cambiar la estrategia de notificación
// Patrón Dependency Injection: Se puede inyectar la estrategia deseada
export class MesaService {
  private static instance: MesaService;
  private mesaRepository: MesaRepository;
  private notificacionStrategy: NotificacionStrategy;

  private constructor() {
    this.mesaRepository = MesaRepository.getInstance();
    this.notificacionStrategy = WebSocketNotificacionStrategy.getInstance();
  }

  public static getInstance(): MesaService {
    if (!MesaService.instance) {
      MesaService.instance = new MesaService();
    }
    return MesaService.instance;
  }

  public setNotificacionStrategy(strategy: NotificacionStrategy): void {
    this.notificacionStrategy = strategy;
  }

  public async getMesasByDocenteId(docenteId: string): Promise<Mesa[]> {
    return this.mesaRepository.getMesasByDocenteId(docenteId);
  }

  public async confirmarMesa(
    mesaId: string,
    docenteId: string,
    confirmacion: "aceptado" | "rechazado"
  ): Promise<Mesa> {
    // modificacion del error de "No se verifica tiempo limite"
    // Obtener la mesa
    const mesas = this.mesaRepository.getAllMesas();
    const mesa = mesas.find((m) => m.id === mesaId);
    if (!mesa) {
      throw new Error("Mesa no encontrada");
    }

    // Construir objeto Date con fecha y hora de la mesa
    const fechaHoraMesa = new Date(`${mesa.fecha}T${mesa.hora}:00`);

    // Validar margen de 48 horas
    const ahora = new Date();
    const margen48h = 48 * 60 * 60 * 1000; // 48 horas en ms
    if (fechaHoraMesa.getTime() - ahora.getTime() < margen48h) {
      throw new Error("La mesa debe confirmarse con al menos 48 horas de anticipación.");
    }

    // Continuar con la lógica original
    const mesaActualizada = await this.mesaRepository.updateConfirmacion(
      mesaId,
      docenteId,
      confirmacion
    );
    const docente = mesaActualizada.docentes.find((d) => d.id === docenteId);

    if (docente) {
      const notificacion = NotificacionFactory.crearNotificacionConfirmacion(
        mesaActualizada,
        docente
      );
      await this.notificacionStrategy.enviar(notificacion);
    }

    return mesaActualizada;
  }

  public async enviarRecordatorio(mesaId: string): Promise<void> {
    const mesas = this.mesaRepository.getAllMesas();
    const mesa = mesas.find((m) => m.id === mesaId);

    if (mesa) {
      const notificacion =
        NotificacionFactory.crearNotificacionRecordatorio(mesa);
      await this.notificacionStrategy.enviar(notificacion);
    }
  }
}
