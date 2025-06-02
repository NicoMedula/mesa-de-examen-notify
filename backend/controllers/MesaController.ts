import { Request, Response } from "express";
import { MesaService } from "../services/MesaService";
import { v4 as uuidv4 } from "uuid";
import { NotificacionService } from "../services/NotificacionService";

// Patrón Singleton: Única instancia de MesaController
export class MesaController {
  private static instance: MesaController;
  private mesaService: MesaService;
  private notificacionService: NotificacionService;

  private constructor() {
    this.mesaService = MesaService.getInstance();
    this.notificacionService = new NotificacionService();
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

  /**
   * Obtiene todas las mesas de examen
   */
  public async getAllMesas(req: Request, res: Response): Promise<void> {
    try {
      const mesas = await this.mesaService.getAllMesas();
      console.log(`Obtenidas ${mesas.length} mesas en total`);
      res.json(mesas);
    } catch (error) {
      console.error("Error en getAllMesas:", error);
      res.status(500).json({ error: "Error al obtener las mesas" });
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
        
        // Enviar notificaciones a los docentes involucrados
        try {
          await this.enviarNotificacionConfirmacion(mesa, docenteId, confirmacion);
        } catch (notifError) {
          console.error('Error al enviar notificación de confirmación:', notifError);
          // No bloqueamos el flujo principal si falla la notificación
        }
        
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
          docente_titular,
          docente_vocal,
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
    try {
      // Busca el nombre del docente en la tabla profiles
      const { data, error } = await require("../config/supabase")
        .supabase.from("profiles")
        .select("nombre")
        .eq("id", id)
        .single();
      return data?.nombre || "";
    } catch (error) {
      console.error(`Error al obtener nombre del docente ${id}:`, error);
      return `Docente ${id.substring(0, 4)}`;
    }
  }
  
  /**
   * Envía notificaciones push cuando se confirma una mesa de examen
   */
  private async enviarNotificacionConfirmacion(mesa: any, docenteId: string, confirmacion: string): Promise<void> {
    try {
      // Obtener información de la mesa para la notificación
      const materiaStr = mesa.materia || 'Sin especificar';
      const fechaStr = mesa.fecha || 'Sin fecha';
      const estadoStr = confirmacion === 'aceptado' ? 'aceptada' : 
                      confirmacion === 'rechazado' ? 'rechazada' : 'pendiente';
      
      // Preparar el mensaje para la notificación
      const notificacionPayload = {
        title: `Mesa de examen ${estadoStr}`,
        body: `La mesa de ${materiaStr} (${fechaStr}) ha sido ${estadoStr} por un docente.`,
        tag: `mesa-${mesa.id}`,
        icon: '/favicon.ico',
        url: '/docente-dashboard',
        requireInteraction: true
      };
      
      console.log(`Enviando notificación de confirmación para mesa ${mesa.id} (${estadoStr})`);
      
      // Enviar a todos los docentes involucrados excepto al que hizo la confirmación
      const docentesIds = mesa.docentes
        .map((d: any) => d.id)
        .filter((id: string) => id !== docenteId); // Excluir al docente que confirmó
      
      // Si hay otros docentes, enviarles notificación
      if (docentesIds.length > 0) {
        for (const id of docentesIds) {
          try {
            await this.notificacionService.enviarNotificacionADocente(id, notificacionPayload);
            console.log(`Notificación enviada a docente ${id}`);
          } catch (error) {
            console.error(`Error al enviar notificación a docente ${id}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error en enviarNotificacionConfirmacion:', error);
      throw error;
    }
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

      // Si se envió un array de docentes (caso de cancelación), usarlo direcamente
      let nuevosDocentes;
      if (docentes && Array.isArray(docentes)) {
        console.log("Usando docentes enviados desde frontend:", docentes);
        nuevosDocentes = docentes;
      } else if (docente_titular && docente_vocal) {
        // Caso: actualización normal de la mesa con nuevos docentes
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
        docente_titular: docente_titular || mesaActual.docente_titular,
        docente_vocal: docente_vocal || mesaActual.docente_vocal,
      });
      res.json(mesaActualizada);
    } catch (error) {
      console.error("Error en updateMesa:", error);
      res.status(500).json({ error: "Error al actualizar la mesa" });
    }
  }

  /**
   * Endpoint especial para forzar la confirmación directa de una mesa completa desde el departamento
   * @param req Request con el ID de la mesa
   * @param res Response
   */
  public async confirmarMesaDirecto(req: Request, res: Response): Promise<void> {
    try {
      const { mesaId } = req.params;
      
      console.log(`[confirmarMesaDirecto] Forzando confirmación directa de mesa ${mesaId}`);

      if (!mesaId) {
        res.status(400).json({
          error: "Datos incompletos",
          detalle: "Se requiere el ID de la mesa",
        });
        return;
      }

      // 1. Obtener la mesa actual
      const mesa = await this.mesaService.getMesaById(mesaId);
      if (!mesa) {
        console.error(`[confirmarMesaDirecto] Mesa ${mesaId} no encontrada`);
        res.status(404).json({ error: "Mesa no encontrada" });
        return;
      }
      
      console.log(`[confirmarMesaDirecto] Mesa encontrada: ${JSON.stringify(mesa, null, 2)}`);
      
      // 2. Actualizar el estado de la mesa a "confirmada"
      // y todas las confirmaciones de docentes a "aceptado"
      const docentesActualizados = mesa.docentes.map(d => ({
        ...d,
        confirmacion: "aceptado" as import("../types").EstadoConfirmacion
      }));
      
      const mesaActualizada = await this.mesaService.updateMesa(mesaId, {
        ...mesa,
        estado: "confirmada",
        docentes: docentesActualizados
      });
      
      console.log(`[confirmarMesaDirecto] Mesa actualizada con éxito: ${JSON.stringify(mesaActualizada, null, 2)}`);
      
      // Enviar notificaciones a todos los docentes
      try {
        for (const docente of docentesActualizados) {
          await this.enviarNotificacionConfirmacion(
            mesaActualizada, 
            'departamento', // Indicar que fue confirmado por el departamento
            'aceptado'
          );
        }
      } catch (notifError) {
        console.error('[confirmarMesaDirecto] Error al enviar notificaciones:', notifError);
        // No bloqueamos el flujo principal si falla la notificación
      }
      
      res.status(200).json(mesaActualizada);
    } catch (error: any) {
      console.error("[confirmarMesaDirecto] Error:", error);
      res.status(500).json({
        error: "Error al confirmar la mesa directamente",
        detalle: error?.message || "Error desconocido",
      });
    }
  }
}
