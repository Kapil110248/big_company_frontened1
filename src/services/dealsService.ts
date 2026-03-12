import axios from "axios";

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

export interface Deal {
  id: string;
  title: string;
  clientName: string;
  value: number;
  stage:
  | "lead"
  | "qualified"
  | "proposal"
  | "negotiation"
  | "closed_won"
  | "closed_lost";
  probability: number;
  owner: string;
  expectedCloseDate?: string;
  createdAt: string;
}

export const dealsService = {
  getDeals: async () => {
    const response = await axios.get(`${API_URL}/admin/deals`, getAuthHeader());
    return response.data;
  },
  createDeal: async (data: any) => {
    const response = await axios.post(
      `${API_URL}/admin/deals`,
      data,
      getAuthHeader()
    );
    return response.data;
  },
  updateDeal: async (id: string, data: any) => {
    const response = await axios.put(
      `${API_URL}/admin/deals/${id}`,
      data,
      getAuthHeader()
    );
    return response.data;
  },
  deleteDeal: async (id: string) => {
    const response = await axios.delete(
      `${API_URL}/admin/deals/${id}`,
      getAuthHeader()
    );
    return response.data;
  },
};
