import { Request, Response } from "express";
import { MesaService } from "../services/MesaService";

// Patrón Singleton: Única instancia de MesaController
export class MesaController {
  private static instance: MesaController;
  private mesaService: MesaService;

  private constructor() {
    this.mesaService = MesaService.getInstance();
  }

  public static getInstance(): MesaController {
    if (!MesaController.instance) {
      MesaController.instance = new MesaController();
    }
    return MesaController.instance;
  }

  public async getMesasByDocenteId(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const mesas = await this.mesaService.getMesasByDocenteId(id);
      res.json(mesas);
    } catch (error) {
      console.error("Error en getMesasByDocenteId:", error);
      res.status(500).json({ error: "Error al obtener las mesas del docente" });
    }
  }

  public async confirmarMesa(req: Request, res: Response): Promise<void> {
    try {
      const { mesaId, docenteId } = req.params;
      const { confirmacion } = req.body;

      if (!["aceptado", "rechazado"].includes(confirmacion)) {
        res.status(400).json({ error: "Confirmación inválida" });
        return;
      }

      const mesa = await this.mesaService.confirmarMesa(
        mesaId,
        docenteId,
        confirmacion
      );
      res.json(mesa);
    } catch (error) {
      console.error("Error en confirmarMesa:", error);
      res.status(500).json({ error: "Error al confirmar la mesa" });
    }
  }

  public async enviarRecordatorio(req: Request, res: Response): Promise<void> {
    try {
      const { mesaId } = req.params;
      await this.mesaService.enviarRecordatorio(mesaId);
      res.json({ message: "Recordatorio enviado correctamente" });
    } catch (error) {
      console.error("Error en enviarRecordatorio:", error);
      res.status(500).json({ error: "Error al enviar el recordatorio" });
    }
  }

  public async createMesa(req: Request, res: Response): Promise<void> {
    try {
      const mesa = req.body;
      const nuevaMesa = await this.mesaService.createMesa(mesa);
      res.status(201).json(nuevaMesa);
    } catch (error) {
      console.error("Error en createMesa:", error);
      res.status(500).json({ error: "Error al crear la mesa" });
    }
  }

  public async updateMesa(req: Request, res: Response): Promise<void> {
    try {
      const { mesaId } = req.params;
      const mesaActualizada = req.body;
      const mesa = await this.mesaService.updateMesa(mesaId, mesaActualizada);
      res.json(mesa);
    } catch (error) {
      console.error("Error en updateMesa:", error);
      res.status(500).json({ error: "Error al actualizar la mesa" });
    }
  }

  public async deleteMesa(req: Request, res: Response): Promise<void> {
    try {
      const { mesaId } = req.params;
      await this.mesaService.deleteMesa(mesaId);
      res.status(204).send();
    } catch (error) {
      console.error("Error en deleteMesa:", error);
      res.status(500).json({ error: "Error al eliminar la mesa" });
    }
  }

  public async getAllMesas(req: Request, res: Response): Promise<void> {
    try {
      const mesas = await this.mesaService.getAllMesas();
      res.json(mesas);
    } catch (error) {
      console.error("Error en getAllMesas:", error);
      res.status(500).json({ error: "Error al obtener las mesas" });
    }
  }
}
