export type UserRole = 'admin' | 'member' | 'partner' | 'elite';

export interface AuthUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  role: string;
  phonenumber: string | null;
  provider?: string | null;
  is_elite: boolean;
  is_partner: boolean;
  created_at: string;
}
