import { Request, Response } from "express";
import { MesaService } from "../services/MesaService";
import { v4 as uuidv4 } from "uuid";

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
      const { materia, fecha, hora, aula, docente_titular, docente_vocal } =
        req.body;
      // Crear array de docentes con confirmación pendiente
      const docentes = [
        {
          id: docente_titular,
          nombre: await this.getNombreDocente(docente_titular),
          confirmacion: "pendiente" as import("../types").EstadoConfirmacion,
        },
        {
          id: docente_vocal,
          nombre: await this.getNombreDocente(docente_vocal),
          confirmacion: "pendiente" as import("../types").EstadoConfirmacion,
        },
      ];
      const mesaObj = {
        id: uuidv4(),
        materia,
        fecha,
        hora,
        aula,
        docentes,
      };
      console.log("Intentando crear mesa en Supabase:", mesaObj);
      const nuevaMesa = await this.mesaService.createMesa(mesaObj);
      res.status(201).json(nuevaMesa);
    } catch (error) {
      console.error("Error en createMesa:", error);
      res.status(500).json({ error: "Error al crear la mesa" });
    }
  }

  private async getNombreDocente(id: string): Promise<string> {
    // Busca el nombre del docente en la tabla profiles
    const { data, error } = await require("../config/supabase")
      .supabase.from("profiles")
      .select("nombre")
      .eq("id", id)
      .single();
    return data?.nombre || "";
  }

  public async updateMesa(req: Request, res: Response): Promise<void> {
    try {
      const { mesaId } = req.params;
      const { fecha, hora, aula, docente_titular, docente_vocal } = req.body;
      // Obtener la mesa actual
      const mesaActual = await this.mesaService
        .getAllMesas()
        .then((mesas) => mesas.find((m) => m.id === mesaId));
      if (!mesaActual) {
        res.status(404).json({ error: "Mesa no encontrada" });
        return;
      }
      // Actualizar docentes: si cambió alguno, ponerlo en pendiente
      const nuevosDocentes = [
        {
          id: docente_titular,
          nombre: await this.getNombreDocente(docente_titular),
          confirmacion: "pendiente" as import("../types").EstadoConfirmacion,
        },
        {
          id: docente_vocal,
          nombre: await this.getNombreDocente(docente_vocal),
          confirmacion: "pendiente" as import("../types").EstadoConfirmacion,
        },
      ];
      // Mantener confirmación si el docente ya estaba y no cambió
      for (const nuevo of nuevosDocentes) {
        const anterior = mesaActual.docentes.find((d) => d.id === nuevo.id);
        if (anterior) {
          nuevo.confirmacion = anterior.confirmacion;
        }
      }
      const mesaActualizada = await this.mesaService.updateMesa(mesaId, {
        fecha,
        hora,
        aula,
        docentes: nuevosDocentes,
      });
      res.json(mesaActualizada);
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
