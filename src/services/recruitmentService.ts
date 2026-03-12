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

export interface JobPosting {
  id: string;
  title: string;
  department: string;
  type: string;
  salaryMin: number;
  salaryMax: number;
  location: string;
  description: string;
  status: "open" | "closed";
  postedDate: string;
  _count?: {
    applications: number;
  };
}

export interface Applicant {
  id: string;
  jobId: string;
  job?: { title: string };
  name: string;
  email: string;
  phone: string;
  resumeUrl?: string;
  status:
  | "applied"
  | "screening"
  | "interview"
  | "offer"
  | "hired"
  | "rejected";
  appliedDate: string;
}

export const recruitmentService = {
  // Jobs
  getJobs: async () => {
    const response = await axios.get(`${API_URL}/admin/jobs`, getAuthHeader());
    return response.data;
  },
  createJob: async (data: any) => {
    const response = await axios.post(
      `${API_URL}/admin/jobs`,
      data,
      getAuthHeader()
    );
    return response.data;
  },
  updateJob: async (id: string, data: any) => {
    const response = await axios.put(
      `${API_URL}/admin/jobs/${id}`,
      data,
      getAuthHeader()
    );
    return response.data;
  },
  deleteJob: async (id: string) => {
    const response = await axios.delete(
      `${API_URL}/admin/jobs/${id}`,
      getAuthHeader()
    );
    return response.data;
  },

  // Applications
  getApplications: async (jobId?: string) => {
    const url = jobId
      ? `${API_URL}/admin/applications?jobId=${jobId}`
      : `${API_URL}/admin/applications`;
    const response = await axios.get(url, getAuthHeader());
    return response.data;
  },
  createApplication: async (data: any) => {
    const response = await axios.post(
      `${API_URL}/admin/applications`,
      data,
      getAuthHeader()
    );
    return response.data;
  },
  updateApplicationStatus: async (id: string, status: string) => {
    const response = await axios.put(
      `${API_URL}/admin/applications/${id}/status`,
      { status },
      getAuthHeader()
    );
    return response.data;
  },
};
