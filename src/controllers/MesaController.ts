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
      // Forzar cabeceras JSON
      res.setHeader("Content-Type", "application/json");

      const { id } = req.params;
      console.log(`Obteniendo mesas para el docente con ID: ${id}`);

      if (!id) {
        console.error("ID de docente no proporcionado");
        res.status(400).json({ error: "ID de docente requerido" });
        return;
      }

      try {
        const mesas = await this.mesaService.getMesasByDocenteId(id);
        console.log(
          `Encontradas ${mesas?.length || 0} mesas para el docente ${id}`
        );

        // Asegurar que siempre devolvemos un array, incluso vacío
        res.status(200).json(mesas || []);
      } catch (serviceError: any) {
        console.error(
          `Error del servicio al obtener mesas para docente ${id}:`,
          serviceError
        );
        res.status(500).json({
          error: "Error al obtener las mesas del docente",
          detalle: serviceError?.message || "Error en el servicio",
          origen: "servicio",
        });
      }
    } catch (error: any) {
      console.error("Error general en getMesasByDocenteId:", error);
      res.status(500).json({
        error: "Error al obtener las mesas del docente",
        detalle: error?.message || "Error desconocido",
        origen: "controlador",
      });
    }
  }

  public async confirmarMesa(req: Request, res: Response): Promise<void> {
    try {
      const { mesaId, docenteId } = req.params;
      const { confirmacion } = req.body;

      console.log(
        `Recibida solicitud de confirmación: Mesa ${mesaId}, Docente ${docenteId}, Estado: ${confirmacion}`
      );

      if (!["aceptado", "rechazado", "pendiente"].includes(confirmacion)) {
        console.error(`Confirmación inválida: ${confirmacion}`);
        res.status(400).json({ error: "Confirmación inválida" });
        return;
      }

      try {
        const mesa = await this.mesaService.confirmarMesa(
          mesaId,
          docenteId,
          confirmacion as import("../types").EstadoConfirmacion
        );

        console.log(`Confirmación exitosa para mesa ${mesaId}`);
        res.json(mesa);
      } catch (serviceError: any) {
        // Capturar errores específicos del servicio y enviar una respuesta adecuada
        console.error(
          `Error del servicio al confirmar mesa ${mesaId}:`,
          serviceError
        );

        // Determinar el código de error apropiado basado en el mensaje
        const errorMessage = serviceError.message || "Error desconocido";

        if (errorMessage.includes("no encontrada")) {
          res.status(404).json({
            error: errorMessage,
            detalle: "La mesa solicitada no existe en la base de datos",
          });
        } else if (errorMessage.includes("no asignado")) {
          res.status(403).json({
            error: errorMessage,
            detalle: "El docente no está asignado a esta mesa",
          });
        } else {
          res.status(500).json({
            error: "Error al confirmar la mesa",
            detalle: errorMessage,
          });
        }
      }
    } catch (error: any) {
      console.error("Error general en confirmarMesa:", error);
      res.status(500).json({
        error: "Error al procesar la solicitud",
        detalle: error.message || "Error desconocido",
      });
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
      console.log("Recibida solicitud para crear mesa:", req.body);

      // Validar que los campos obligatorios estén presentes
      const { materia, fecha, hora, aula, docente_titular, docente_vocal } =
        req.body;

      if (!materia) {
        console.error("Falta campo obligatorio: materia");
        res.status(400).json({ error: "La materia es un campo obligatorio" });
        return;
      }

      if (!fecha) {
        console.error("Falta campo obligatorio: fecha");
        res.status(400).json({ error: "La fecha es un campo obligatorio" });
        return;
      }

      if (!docente_titular) {
        console.error("Falta campo obligatorio: docente_titular");
        res
          .status(400)
          .json({ error: "El docente titular es un campo obligatorio" });
        return;
      }

      if (!docente_vocal) {
        console.error("Falta campo obligatorio: docente_vocal");
        res
          .status(400)
          .json({ error: "El docente vocal es un campo obligatorio" });
        return;
      }

      // Generar un ID único para la mesa
      const mesaId = uuidv4();
      console.log("ID generado para la nueva mesa:", mesaId);

      try {
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
          id: mesaId,
          materia,
          fecha,
          hora,
          aula: aula || "", // Asegurar que aula no sea null
          estado: "pendiente" as import("../types").EstadoMesa, // Usar el tipo correcto
          docentes,
        };

        console.log(
          "Intentando crear mesa en Supabase:",
          JSON.stringify(mesaObj, null, 2)
        );
        const nuevaMesa = await this.mesaService.createMesa(mesaObj);
        console.log("Mesa creada exitosamente:", nuevaMesa);
        res.status(201).json(nuevaMesa);
      } catch (serviceError: any) {
        // Manejar errores específicos del servicio
        console.error("Error del servicio al crear mesa:", serviceError);

        // Diferenciar entre errores de validación y errores internos
        // Enviar código 400 para errores de validación
        if (
          serviceError.message &&
          (serviceError.message.includes("en el pasado") ||
            serviceError.message.includes("48 horas") ||
            serviceError.message.includes("obligatoria") ||
            serviceError.message.includes("se requieren") ||
            serviceError.message.includes("Conflicto de horario"))
        ) {
          console.error(
            "Error de validación al crear mesa:",
            serviceError.message
          );
          res.status(400).json({
            error: "Error de validación",
            detalle: serviceError.message,
          });
          return;
        }

        // Para otros errores, seguir usando 500
        res.status(500).json({
          error: "Error al crear la mesa",
          detalle: serviceError.message || "Error desconocido",
        });
      }
    } catch (error: any) {
      console.error("Error general en createMesa:", error);
      res.status(500).json({
        error: "Error al procesar la solicitud",
        detalle: error.message || "Error desconocido",
      });
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
      const {
        fecha,
        hora,
        aula,
        estado,
        docente_titular,
        docente_vocal,
        docentes,
      } = req.body;
      console.log("Actualizando mesa:", mesaId, "con body:", req.body);

      // Obtener la mesa actual
      const mesaActual = await this.mesaService
        .getAllMesas()
        .then((mesas) => mesas.find((m) => m.id === mesaId));
      if (!mesaActual) {
        res.status(404).json({ error: "Mesa no encontrada" });
        return;
      }

      // Si se enviu00f3 un array de docentes (caso de cancelaciu00f3n), usarlo direcamente
      let nuevosDocentes;
      if (docentes && Array.isArray(docentes)) {
        console.log("Usando docentes enviados desde frontend:", docentes);
        nuevosDocentes = docentes;
      } else if (docente_titular && docente_vocal) {
        // Caso: actualizaciu00f3n normal de la mesa con nuevos docentes
        console.log("Creando nuevos docentes a partir de titular/vocal");
        nuevosDocentes = [
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
      } else {
        // Si no hay ni docentes ni titular/vocal, mantener los actuales
        nuevosDocentes = mesaActual.docentes;
      }

      const mesaActualizada = await this.mesaService.updateMesa(mesaId, {
        fecha: fecha || mesaActual.fecha,
        hora: hora || mesaActual.hora,
        aula: aula !== undefined ? aula : mesaActual.aula,
        estado: estado || mesaActual.estado,
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
