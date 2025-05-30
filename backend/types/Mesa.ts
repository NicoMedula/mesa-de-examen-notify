import { EstadoConfirmacion, EstadoMesa } from "./index";

export interface Docente {
  id: string;
  nombre: string;
  confirmacion: EstadoConfirmacion;
}

export interface Mesa {
  id: string;
  materia: string;
  fecha: string;
  hora: string;
  aula: string;
  estado: EstadoMesa;
  docente_titular: string;
  docente_vocal: string;
  docentes: Docente[];
  created_at?: string;
  updated_at?: string;
}
