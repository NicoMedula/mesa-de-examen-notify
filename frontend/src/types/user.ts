export type UserRole = "docente" | "departamento";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  nombre: string;
}
