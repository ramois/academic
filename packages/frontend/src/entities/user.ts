/** Roles del sistema. Coinciden con el backend (nombre del rol). */
export type Role = 'ADMINISTRATOR' | 'STUDENT' | 'TEACHER';

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};
