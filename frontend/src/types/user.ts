export type UserRole = "docente";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  nombre: string;
}
