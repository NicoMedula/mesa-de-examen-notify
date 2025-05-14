import { Request } from "express";
export type EstadoConfirmacion = "aceptado" | "rechazado" | "pendiente";
export type RolUsuario = "docente" | "departamento";

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

export interface UsuarioAutenticado {
  id: string;
  rol: RolUsuario;
  nombre?: string;
}

export interface RequestConUsuario extends Request {
  user?: UsuarioAutenticado;
}
