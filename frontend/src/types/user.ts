export interface User {
  id: number;
  username: string;
  email?: string;
  role: 'CUSTOMER' | 'EMPLOYEE' | 'MANAGER';
  status: 'PENDING' | 'ACTIVE' | 'BLOCKED';
  phone?: string;
  address?: string;
  registration_date: string;
  plain_password?: string;
  is_active: boolean;
}

export interface UserFilters {
  role?: string;
  status?: string;
  registrationDate?: string;
  search?: string;
} 