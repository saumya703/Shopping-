export type UserRole = 'customer' | 'admin';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  phone?: string;
}
