import axios from "axios";
import { LoginCredentials, AuthResponse, UserRole } from "../types/auth";

// Use production URL by default, but local port 9000 for development
import { API_URL } from "../config";

// Role-specific endpoints (admin uses separate internal authentication)
const AUTH_ENDPOINTS: Record<UserRole, string> = {
  consumer: `${API_URL}/store/auth/login`,
  employee: `${API_URL}/employee/auth/login`, // Employee authentication endpoint
  retailer: `${API_URL}/retailer/auth/login`,
  wholesaler: `${API_URL}/wholesaler/auth/login`,
  admin: `${API_URL}/admin/auth/login`, // Admin authentication endpoint
};



export const authService = {
  async login(
    credentials: LoginCredentials,
    role: UserRole
  ): Promise<AuthResponse> {
    // FORCED MOCK MODE REMOVED - Using real backend
    // console.log(`Login attempt for role: ${role} - Mode: Frontend-Only Mock`);

    // ORIGINAL LOGIC (Fallback)
    const endpoint = AUTH_ENDPOINTS[role];

    // Consumer uses phone/PIN, retailer/wholesaler use email/password
    // Consumer uses phone/PIN, retailer/wholesaler use email/password
    let payload: Record<string, string>;

    if (role === "consumer") {
      // Consumer backend expects 'phone' not 'phone_number'
      if (credentials.email && credentials.password) {
        payload = {
          email: credentials.email,
          password: credentials.password,
          role: "consumer",
        };
      } else {
        payload = {
          phone: credentials.phone_number || "",
          pin: credentials.pin || "",
          role: "consumer",
        };
      }
    } else {
      // Employee, retailer, wholesaler, and admin use email/password
      payload = {
        email: credentials.email || "",
        password: credentials.password || "",
        role: role,
      };
    }

    try {
      const response = await axios.post(endpoint, payload, {
        headers: { "Content-Type": "application/json" },
        timeout: 15000,
      });

      // Handle consumer response format
      if (role === "consumer" && response.data.customer) {
        const customer = response.data.customer;
        return {
          success: true,
          access_token: response.data.access_token,
          user: {
            id: customer.id,
            email: customer.email,
            phone: customer.phone,
            name:
              `${customer.first_name || ""} ${customer.last_name || ""}`.trim() ||
              customer.email,
            role: "consumer" as const,
          },
        };
      }

      // Handle retailer response format (returns { access_token, retailer: {...} })
      if (role === "retailer" && response.data.retailer) {
        const retailer = response.data.retailer;
        return {
          success: true,
          access_token: response.data.access_token,
          user: {
            id: retailer.id,
            email: retailer.email,
            phone: retailer.phone,
            name: retailer.name || retailer.shop_name,
            role: "retailer" as const,
            shop_name: retailer.shop_name,
          },
        };
      }

      // Handle wholesaler response format (returns { access_token, wholesaler: {...} })
      if (role === "wholesaler" && response.data.wholesaler) {
        const wholesaler = response.data.wholesaler;
        return {
          success: true,
          access_token: response.data.access_token,
          user: {
            id: wholesaler.id,
            email: wholesaler.email,
            phone: wholesaler.phone,
            name: wholesaler.name || wholesaler.company_name,
            role: "wholesaler" as const,
            company_name: wholesaler.company_name,
          },
        };
      }

      // Handle employee response format
      if (role === "employee" && response.data.employee) {
        const employee = response.data.employee;
        return {
          success: true,
          access_token: response.data.access_token,
          user: {
            id: employee.id,
            email: employee.email,
            phone: employee.phone,
            name: employee.name || `${employee.first_name} ${employee.last_name}`,
            role: "employee" as const,
            employee_number: employee.employee_number,
            department: employee.department,
            position: employee.position,
          },
        };
      }

      // Handle admin response format
      if (role === "admin" && response.data.admin) {
        const admin = response.data.admin;
        return {
          success: true,
          access_token: response.data.access_token,
          user: {
            id: admin.id,
            email: admin.email,
            phone: admin.phone,
            name: admin.name || "Administrator",
            role: "admin" as const,
          },
        };
      }

      // Handle generic user response
      if (response.data.user) {
        return {
          success: true,
          access_token: response.data.access_token,
          user: {
            ...response.data.user,
            role: role,
          },
        };
      }

      // Direct response format
      return {
        success: response.data.success,
        access_token: response.data.access_token || response.data.token,
        user: {
          id: response.data.id || response.data.user_id,
          email:
            response.data.email || `${response.data.phone_number}@bigcompany.rw`,
          phone: response.data.phone_number,
          name:
            response.data.name ||
            response.data.shop_name ||
            response.data.company_name,
          role: role,
          shop_name: response.data.shop_name,
          company_name: response.data.company_name,
        },
      };

    } catch (error: any) {
      console.error(`Login error for ${role}:`, error);
      throw error;
    }
  },

  async register(data: {
    phone_number: string;
    pin: string;
    first_name: string;
    last_name?: string;
    role: UserRole;
    shop_name?: string;
    company_name?: string;
  }): Promise<AuthResponse> {
    const endpoint =
      data.role === "consumer"
        ? `${API_URL}/store/auth/register`
        : data.role === "retailer"
          ? `${API_URL}/retailer/auth/register`
          : `${API_URL}/wholesaler/auth/register`;

    const response = await axios.post(endpoint, data, {
      headers: { "Content-Type": "application/json" },
    });

    return response.data;
  },
};
