export type EstadoConfirmacion = "aceptado" | "rechazado" | "pendiente";

export interface Docente {
  id: string;
  nombre: string;
  confirmacion: EstadoConfirmacion;
}

export interface Mesa {
  id: string;
  fecha: string;
  hora: string;
  ubicacion: string;
  docentes: Docente[];
}

export interface MesasData {
  mesas: Mesa[];
}
