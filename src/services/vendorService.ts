import axios from 'axios';
import { API_URL } from '../config';

export interface Vendor {
    id: string;
    name: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    address?: string;
    status: 'active' | 'inactive';
    _count?: {
        products: number;
    };
}

class VendorService {
    private getAuthHeaders() {
        const token = localStorage.getItem('admin_token') || localStorage.getItem('bigcompany_token');
        return {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        };
    }

    async getVendors() {
        const response = await axios.get(`${API_URL}/admin/vendors`, this.getAuthHeaders());
        return response.data;
    }

    async getVendor(id: string) {
        const response = await axios.get(`${API_URL}/admin/vendors/${id}`, this.getAuthHeaders());
        return response.data;
    }

    async createVendor(data: Omit<Vendor, 'id' | '_count' | 'status'>) {
        const response = await axios.post(`${API_URL}/admin/vendors`, data, this.getAuthHeaders());
        return response.data;
    }

    async updateVendor(id: string, data: Partial<Vendor>) {
        const response = await axios.put(`${API_URL}/admin/vendors/${id}`, data, this.getAuthHeaders());
        return response.data;
    }

    async deleteVendor(id: string) {
        const response = await axios.delete(`${API_URL}/admin/vendors/${id}`, this.getAuthHeaders());
        return response.data;
    }
}

export const vendorService = new VendorService();
