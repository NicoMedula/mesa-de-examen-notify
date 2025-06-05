import { Request, Response } from "express";
import RecordatorioRepository from "../src/repositories/RecordatorioRepository";
import { MesaRepository } from "../repositories/MesaRepository";
import { NotificacionFactory } from "../factories/NotificacionFactory";
import { PushNotificacionStrategy } from "../strategies/NotificacionStrategy";

export class RecordatorioController {
  private static instance: RecordatorioController;
  private recordatorioRepository: RecordatorioRepository;
  private mesaRepository: MesaRepository;

  private constructor() {
    this.recordatorioRepository = RecordatorioRepository.getInstance();
    this.mesaRepository = MesaRepository.getInstance();
  }

  public static getInstance(): RecordatorioController {
    if (!RecordatorioController.instance) {
      RecordatorioController.instance = new RecordatorioController();
    }
    return RecordatorioController.instance;
  }

  public async crearRecordatorio(req: Request, res: Response): Promise<void> {
    try {
      const { mesaId } = req.params;
      const { horasAntes } = req.body;

      if (!mesaId || !horasAntes) {
        res.status(400).json({ error: "Faltan parámetros requeridos" });
        return;
      }

      const recordatorio = await this.recordatorioRepository.createRecordatorio(
        mesaId,
        horasAntes
      );

      res.status(201).json(recordatorio);
    } catch (error: any) {
      console.error("Error al crear recordatorio:", error);
      res
        .status(500)
        .json({ error: error.message || "Error al crear recordatorio" });
    }
  }

  public async getRecordatoriosByMesaId(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { mesaId } = req.params;

      if (!mesaId) {
        res.status(400).json({ error: "ID de mesa no proporcionado" });
        return;
      }

      const recordatorios =
        await this.recordatorioRepository.getRecordatoriosByMesaId(mesaId);
      res.json(recordatorios);
    } catch (error: any) {
      console.error("Error al obtener recordatorios:", error);
      res
        .status(500)
        .json({ error: error.message || "Error al obtener recordatorios" });
    }
  }

  public async deleteRecordatorio(req: Request, res: Response): Promise<void> {
    try {
      const { recordatorioId } = req.params;

      if (!recordatorioId) {
        res.status(400).json({ error: "ID de recordatorio no proporcionado" });
        return;
      }

      await this.recordatorioRepository.deleteRecordatorio(recordatorioId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error al eliminar recordatorio:", error);
      res
        .status(500)
        .json({ error: error.message || "Error al eliminar recordatorio" });
    }
  }

  public async procesarRecordatoriosPendientes(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const recordatoriosPendientes =
        await this.recordatorioRepository.getRecordatoriosPendientes();
      const ahora = new Date();
      let procesados = 0;

      for (const recordatorio of recordatoriosPendientes) {
        try {
          // Verificar si la mesa existe y obtener sus datos
          const mesa = await this.mesaRepository.getMesaById(
            recordatorio.mesa_id
          );
          if (!mesa) continue;

          // Calcular si es momento de enviar el recordatorio
          const fechaMesa = new Date(mesa.fecha);
          const horasRestantes =
            (fechaMesa.getTime() - ahora.getTime()) / (1000 * 60 * 60);

          if (
            horasRestantes <= recordatorio.horas_antes &&
            !recordatorio.enviado
          ) {
            // Crear notificación
            const notificacion =
              NotificacionFactory.crearNotificacionRecordatorio(mesa);

            // Obtener IDs de destinatarios (docentes de la mesa)
            const destinatarios = mesa.docentes.map((docente) => docente.id);

            // Enviar notificación
            if (destinatarios.length > 0) {
              await PushNotificacionStrategy.getInstance().enviar({
                ...notificacion,
                destinatarios,
              });
            }

            // Marcar como enviado
            await this.recordatorioRepository.updateRecordatorio(
              recordatorio.id,
              { enviado: true }
            );
            procesados++;
          }
        } catch (error) {
          console.error(
            `Error procesando recordatorio ${recordatorio.id}:`,
            error
          );
          continue;
        }
      }

      res.json({ success: true, procesados });
    } catch (error: any) {
      console.error("Error al procesar recordatorios pendientes:", error);
      res.status(500).json({
        error: error.message || "Error al procesar recordatorios pendientes",
      });
    }
  }
}
