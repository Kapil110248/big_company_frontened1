import axios from "axios";

// Use production URL by default, but local port 9000 for development
import { API_URL } from "../config";

const getAuthHeader = () => {
  const token = localStorage.getItem("bigcompany_token");
  const adminToken = localStorage.getItem("admin_token");
  return {
    headers: {
      Authorization: `Bearer ${token || adminToken}`,
      "Content-Type": "application/json",
    },
  };
};

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  status: "active" | "inactive";
  createdAt: string;
  products?: any[];
  _count?: {
    products: number;
  };
}

export const supplierService = {
  // Get all suppliers
  getSuppliers: async () => {
    const response = await axios.get(
      `${API_URL}/admin/suppliers`,
      getAuthHeader()
    );
    return response.data;
  },

  // Create supplier
  createSupplier: async (data: any) => {
    const response = await axios.post(
      `${API_URL}/admin/suppliers`,
      data,
      getAuthHeader()
    );
    return response.data;
  },

  // Update supplier
  updateSupplier: async (id: string, data: any) => {
    const response = await axios.put(
      `${API_URL}/admin/suppliers/${id}`,
      data,
      getAuthHeader()
    );
    return response.data;
  },

  // Delete supplier
  deleteSupplier: async (id: string) => {
    const response = await axios.delete(
      `${API_URL}/admin/suppliers/${id}`,
      getAuthHeader()
    );
    return response.data;
  },
};
