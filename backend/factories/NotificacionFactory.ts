import { Mesa, Docente } from "../types";

export interface Notificacion {
  mensaje: string;
  tipo: "confirmacion" | "recordatorio" | "actualizacion";
  timestamp: Date;
}

// Patrón Factory: Centraliza la creación de objetos de notificación
export class NotificacionFactory {
  public static crearNotificacionConfirmacion(
    mesa: Mesa,
    docente: Docente
  ): Notificacion {
    return {
      mensaje: `El docente ${docente.nombre} ha ${docente.confirmacion} la mesa del ${mesa.fecha} a las ${mesa.hora}`,
      tipo: "confirmacion",
      timestamp: new Date(),
    };
  }

  public static crearNotificacionRecordatorio(mesa: Mesa): Notificacion {
    return {
      mensaje: `Recordatorio: Mesa de examen el ${mesa.fecha} a las ${mesa.hora} en ${mesa.aula}`,
      tipo: "recordatorio",
      timestamp: new Date(),
    };
  }

  public static crearNotificacionActualizacion(
    mesa: Mesa,
    cambios: string
  ): Notificacion {
    return {
      mensaje: `${cambios} Materia: ${mesa.materia}, Fecha: ${mesa.fecha}, Hora: ${mesa.hora}, Aula: ${mesa.aula}`,
      tipo: "actualizacion",
      timestamp: new Date(),
    };
  }
}
