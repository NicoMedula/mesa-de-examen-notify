import { Request } from "express";
export type EstadoConfirmacion = "aceptado" | "rechazado" | "pendiente";
export type RolUsuario = "docente" | "departamento";

export interface Docente {
  id: string;
  nombre: string;
  confirmacion: EstadoConfirmacion;
}

export type EstadoMesa = "pendiente" | "confirmada" | "cancelada";

export interface Mesa {
  id: string;
  materia: string;
  fecha: string;
  hora: string;
  aula: string;
  estado?: EstadoMesa; // Campo opcional ya que no existe en la tabla de la BD
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
