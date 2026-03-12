export type UserRole = 'consumer' | 'retailer' | 'wholesaler' | 'admin' | 'employee';

export interface User {
  id: string;
  email: string;
  phone?: string;
  name?: string;
  role: UserRole;
  shop_name?: string;      // For retailers
  company_name?: string;   // For wholesalers
  employee_number?: string; // For employees
  department?: string;      // For employees
  position?: string;        // For employees
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Consumer uses phone/PIN, retailers/wholesalers use email/password
export interface LoginCredentials {
  // For consumer
  phone_number?: string;
  pin?: string;
  // For retailer/wholesaler
  email?: string;
  password?: string;
}

export interface AuthResponse {
  success?: boolean;
  access_token: string;
  user?: User;
  customer?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
  };
  message?: string;
}
