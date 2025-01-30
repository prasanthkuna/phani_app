export interface User {
  id: number;
  username: string;
  email: string | null;
  role: 'CUSTOMER' | 'EMPLOYEE' | 'MANAGER';
  status: 'PENDING' | 'ACTIVE' | 'BLOCKED';
  registration_date: string;
  last_modified: string;
  phone: string;
  address: string;
  is_active: boolean;
}

export interface UserFilters {
  role?: string;
  status?: string;
  registrationDate?: string;
  search?: string;
} 